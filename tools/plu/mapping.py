"""Maps the commodity and variety of the IFPS list to the name that ShelfMate shows (English key)."""
import re

# commodity -> name, optional rules (regex on the variety -> name) tried first
RULES = {
 'APPLES': 'Apples', 'PEARS': 'Pears', 'ORANGES': 'Oranges',
 'TANGERINES/MANDARINS': ('Mandarins', [('Clementine', 'Clementines')]),
 'MELON': ('Melons', [('Watermelon|Mickey Lee', 'Watermelons'), ('Cantaloupe', 'Cantaloupe melons'), ('Honeydew', 'Honeydew melons')]),
 'NECTARINE': 'Nectarines', 'PINEAPPLE': 'Pineapples', 'PASSION FRUIT': 'Passion fruit',
 'PHYSALIS/CAPE GOOSEBERRY/GROUND CHERRY': 'Physalis', 'PITAHAYA': 'Dragon fruit', 'RAMBUTAN': 'Rambutan',
 'MANGOSTEEN': 'Mangosteen', 'GRAPES': 'Grapes', 'APRICOTS': 'Apricots', 'DATES': 'Dates',
 'AVOCADOS': 'Avocados',
 'BERRIES': ('Berries', [('Strawberr', 'Strawberries'), ('Blackberr', 'Blackberries'), ('Blueberr', 'Blueberries'), ('Raspberr', 'Raspberries'), ('Cranberr', 'Cranberries'), ('Gooseberr', 'Gooseberries')]),
 'GRAPEFRUIT': ('Grapefruit', [('Pummelo', 'Pomelos')]),
 'CURRANTS': 'Currants', 'PAPAYA/PAWPAW': 'Papaya', 'PEACHES': 'Peaches', 'MANGO': 'Mangos',
 'PLUMCOT (INTERSPECIFIC PLUM)': 'Plums', 'PRUNES': 'Plums', 'PLUMS': 'Plums', 'POMEGRANATE': 'Pomegranates',
 'SAPODILLO/NISPERO': 'Fruit', 'SAPOTE': 'Fruit', 'BABACO': 'Fruit', 'MADROÑA': 'Fruit', 'HOMLI FRUIT': 'Fruit',
 'ATEMOYAS': 'Fruit', 'MAMEY': 'Fruit', 'SALAD BAR': 'Fruit', 'OTHER FRUITS': 'Fruit',
 'KIWIFRUIT': 'Kiwis', 'BANANAS': ('Bananas', [('Plantain|Macho', 'Plantains')]),
 'CHERRIES': 'Cherries', 'LEMONS': 'Lemons', 'SOURSOP': 'Soursop', 'SUGAR APPLE': 'Sugar apples', 'JACKFRUIT': 'Jackfruit',
 'LIMES': 'Limes', 'LIMEQUATS': 'Limes', 'TANGELO': 'Mandarins', 'BREADFRUIT': 'Breadfruit',
 'CACTUS PEAR (PRICKLY PEAR)': 'Prickly pears', 'CARAMBOLA (STARFRUIT)': 'Starfruit', 'CHERIMOYA': 'Cherimoya',
 'COCONUTS': 'Coconuts', 'FEIJOA': 'Feijoa', 'FIGS': 'Figs', 'GUAVA': 'Guava', 'KIWANO (HORNED MELON)': 'Horned melon',
 'KUMQUAT': 'Kumquats', 'LONGAN': 'Longan', 'LOQUATS': 'Loquats', 'LYCHEES': 'Lychees', 'PERSIMMON': 'Persimmons',
 'QUINCE': 'Quinces', 'TAMARIND': 'Tamarind',
 'BEANS': 'Beans', 'CABBAGE': ('Cabbage', [('Chinese', 'Chinese cabbage'), ('Red', 'Red cabbage'), ('Savoy', 'Savoy cabbage'), ('^Green$|Dutch White|Winter White', 'White cabbage')]),
 'GARLIC': 'Garlic', 'PARSNIP': 'Parsnips',
 'PEPPERS (CAPSICUMS)': ('Chili peppers', [('Bell|Elongated', 'Bell peppers'), ('Retailer', 'Peppers')]),
 'SQUASH': ('Squash', [('Zucchini|Courgette|Summer \\(Green\\)|Marrow', 'Zucchini'), ('Butternut|Butterkin', 'Butternut squash'), ('Red Kuri', 'Hokkaido squash'), ('Chayote', 'Chayote'), ('Spaghetti', 'Spaghetti squash'), ('Patty Pan', 'Pattypan squash')]),
 'GOURD': 'Squash', 'PUMPKIN': 'Pumpkins',
 'TOMATOES': ('Tomatoes', [('Cherry', 'Cherry tomatoes'), ('Tomatillo', 'Tomatillos')]),
 'ASPARAGUS': 'Asparagus', 'BROCCOLI': 'Broccoli', 'BRUSSELS SPROUTS': 'Brussels sprouts',
 'CORN': 'Sweet corn', 'EGGPLANT (AUBERGINE)': 'Eggplants', 'GOBO ROOT/BURDOCK': 'Vegetables',
 'KALE': 'Kale', 'KALE SPROUTS': 'Kale', 'KOHLRABI': 'Kohlrabi',
 'LETTUCE': ('Lettuce', [('Iceberg', 'Iceberg lettuce'), ('Romaine', 'Romaine lettuce'), ('Mache', "Lamb's lettuce")]),
 'LOTUS ROOT': 'Lotus root',
 'MUSHROOMS': ('Mushrooms', [('^Regular|Cremini|Portabella', 'Button mushrooms'), ('Chanterelle', 'Chanterelles'), ('Oyster', 'Oyster mushrooms'), ('Shiitake', 'Shiitake'), ('Cep', 'Porcini')]),
 'GAI LAN': 'Asian greens', 'GAI (GUI) CHOY (CHINESE or INDIAN MUSTARD)': 'Asian greens', 'ONG CHOY': 'Asian greens',
 'BOK CHOY (PAK CHOI)': 'Pak choi', 'YU CHOY': 'Asian greens', 'CHOY SUM/PAK CHOI SUM': 'Asian greens',
 'RADICCHIO': 'Radicchio', 'FRISEE': 'Frisée', 'BEETS': 'Beetroot', 'NAME': 'Yams',
 'ONIONS': ('Onions', [('Green|Spring', 'Spring onions'), ('Red', 'Red onions'), ('Shallot', 'Shallots')]),
 'SWEET POTATO/YAM/KUMARA': 'Sweet potatoes', 'BONIATO': 'Sweet potatoes',
 'CAULIFLOWER': ('Cauliflower', [('Romanesco', 'Romanesco')]),
 'CELERY ROOT/CELERIAC': 'Celeriac', 'ESCAROLE/BATAVIAN CHICORY': 'Endive', 'ENDIVE/CHICORY': 'Endive',
 'SPINACH': 'Spinach', 'ARRACACH': 'Vegetables', 'ARTICHOKES': 'Artichokes', 'BELGIAN ENDIVE (WITLOOF CHICORY)': 'Chicory',
 'CHICKPEAS': 'Chickpeas', 'LEEKS': 'Leeks', 'POTATO': 'Potatoes', 'RHUBARB': 'Rhubarb', 'CARROTS': 'Carrots',
 'GALANGAL ROOT': 'Galangal', 'CUCUMBER': 'Cucumbers', 'CELERY': 'Celery', 'RADISH': 'Radishes', 'PEAS': 'Peas',
 'TURNIP': 'Turnips', 'OTHER VEGETABLES': 'Vegetables', 'ALFALFA SPROUTS': 'Sprouts', 'BEAN SPROUTS': 'Sprouts',
 'BEET GREENS': 'Vegetables', 'CACTUS LEAVES (Nopales/Cactus Pads)': 'Cactus leaves', 'CARDOON (CARDONI)': 'Cardoon',
 'CHARD (SWISS CHARD)/SILVERBEET': 'Chard', 'DAIKON': 'Daikon radish', 'FIDDLEHEAD FERNS': 'Vegetables',
 'GINGER ROOT': 'Ginger', 'GREENS': 'Leafy greens', 'HORSERADISH ROOT': 'Horseradish', 'JICAMA/YAM BEAN': 'Vegetables',
 'MALANGA': 'Vegetables', 'OKRA': 'Okra', 'PARSLEY ROOT(HAMBURG PARSLEY)': 'Parsley root', 'RUTABAGAS (SWEDE)': 'Rutabaga',
 'BITTER MELON/BITTER GOURD, Foo Qua': 'Bitter melon', 'SUGAR CANE': 'Sugar cane', 'SUNCHOKES (JERUSALEM ARTICHOKES)': 'Jerusalem artichokes',
 'TAMARILLO': 'Tamarillo', 'TARO ROOT (DASHEEN)': 'Taro', 'WATER CHESTNUTS': 'Water chestnuts', 'WATERCRESS': 'Watercress',
 'YUCA ROOT/CASSAVA/MANIOC': 'Cassava', 'Amaranth/Callaloo/Een Choy': 'Vegetables', 'QUELITES': 'Vegetables',
 'CHIPILIN LEAF': 'Vegetables', 'PUMPKIN VINE': 'Vegetables', 'XPELON': 'Vegetables',
 'APPLE SLICES': 'Dried fruit', 'OTHER DRIED FRUITS': 'Dried fruit', 'RAISINS': 'Raisins',
 'BAY LEAVES': 'Bay leaves', 'FENNEL LEAVES': 'Fennel', 'FENNEL': 'Fennel', 'ALOE VERA LEAVES': 'Herbs', 'CHERVIL': 'Chervil',
 'ANISE': 'Herbs', 'BORAGE': 'Herbs', 'SAVORY': 'Savory', 'ARUGULA/ROCKET': 'Rocket', 'BASIL': 'Basil', 'CHIVES': 'Chives',
 'CILANTRO (CHINESE PARSLEY/CORIANDER)': 'Coriander', 'DILL': 'Dill', 'LEMONGRASS': 'Lemongrass', 'MARJORAM': 'Marjoram',
 'MINT': 'Mint', 'OREGANO': 'Oregano', 'OYSTER PLANT/SALSIFY': 'Salsify', 'PARSLEY': 'Parsley', 'ROSEMARY': 'Rosemary',
 'SAGE': 'Sage', 'SORREL': 'Sorrel', 'TARRAGON': 'Tarragon', 'THYME': 'Thyme', 'VANILLA BEAN': 'Vanilla beans',
 'OTHER HERBS': 'Herbs', 'SACRED PEPPER': 'Herbs', 'EPAZOTE': 'Herbs', 'ORANGE TREE LEAF': 'Herbs', 'PAPALO': 'Herbs',
 'RABBIT HERB': 'Herbs', 'PURPLE HERB': 'Herbs',
 'ALMONDS': 'Almonds', 'BRAZILNUTS': 'Brazil nuts', 'CASHEWS': 'Cashews', 'CHESTNUTS': 'Chestnuts', 'FILBERTS': 'Hazelnuts',
 'MACADAMIA': 'Macadamia nuts', 'MIXED NUTS': 'Mixed nuts', 'PEANUTS': 'Peanuts', 'PECANS': 'Pecans',
 'PINE NUTS (PIGNOLI)': 'Pine nuts', 'PISTACHIO': 'Pistachios', 'SUNFLOWER SEEDS': 'Sunflower seeds', 'WALNUTS': 'Walnuts',
 'OTHER NUTS': 'Nuts',
 'FOR USE WITH ALL COMMODITIES': 'Fruit or vegetables',
}
def name_of(category, commodity, variety):
    rule = RULES.get(commodity)
    if rule is None:
        raise KeyError((category, commodity))
    if isinstance(rule, str):
        if category == 'Dried Fruits' and rule not in ('Raisins',):
            return 'Dried fruit'
        return rule
    base, subs = rule
    for rx, nm in subs:
        if re.search(rx, variety or ''):
            return nm
    return base
