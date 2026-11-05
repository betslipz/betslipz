// Starting list of teams and players for the admin pickers (scripts/import-teams.mjs loads it).
// Each entry is "Name|country" or "Name|country|search name in TheSportsDB".
// Country codes follow flagcdn: ISO alpha-2 in lower case, or gb-eng / gb-sct / gb-wls / gb-nir.
// Players from Russia and Belarus play under a neutral flag, so they have no country here.
// Add more any time in Admin → Teams; this file is only the first import.

export const football = {
  "Premier League": [
    "Arsenal|gb-eng", "Aston Villa|gb-eng", "Bournemouth|gb-eng", "Brentford|gb-eng", "Brighton & Hove Albion|gb-eng|Brighton",
    "Burnley|gb-eng", "Chelsea|gb-eng", "Crystal Palace|gb-eng", "Everton|gb-eng", "Fulham|gb-eng", "Leeds United|gb-eng|Leeds",
    "Liverpool|gb-eng", "Manchester City|gb-eng", "Manchester United|gb-eng", "Newcastle United|gb-eng|Newcastle",
    "Nottingham Forest|gb-eng", "Sunderland|gb-eng", "Tottenham Hotspur|gb-eng|Tottenham", "West Ham United|gb-eng|West Ham",
    "Wolverhampton Wanderers|gb-eng|Wolves", "Leicester City|gb-eng|Leicester", "Southampton|gb-eng", "Ipswich Town|gb-eng|Ipswich",
  ],
  "La Liga": [
    "Athletic Bilbao|es|Athletic Bilbao", "Atlético Madrid|es|Atletico Madrid", "Barcelona|es", "Celta Vigo|es", "Deportivo Alavés|es|Alaves",
    "Elche|es", "Espanyol|es", "Getafe|es", "Girona|es", "Levante|es", "Mallorca|es", "Osasuna|es", "Rayo Vallecano|es",
    "Real Betis|es", "Real Madrid|es", "Real Oviedo|es", "Real Sociedad|es", "Sevilla|es", "Valencia|es", "Villarreal|es",
  ],
  "Serie A": [
    "Atalanta|it", "Bologna|it", "Cagliari|it", "Como|it", "Cremonese|it", "Fiorentina|it", "Genoa|it", "Hellas Verona|it|Verona",
    "Inter|it|Inter Milan", "Juventus|it", "Lazio|it", "Lecce|it", "AC Milan|it", "Napoli|it", "Parma|it", "Pisa|it", "Roma|it|AS Roma",
    "Sassuolo|it", "Torino|it", "Udinese|it",
  ],
  Bundesliga: [
    "Augsburg|de|FC Augsburg", "Bayer Leverkusen|de", "Bayern Munich|de", "Borussia Dortmund|de", "Borussia Mönchengladbach|de|Borussia Monchengladbach",
    "Eintracht Frankfurt|de", "FC Köln|de|FC Koln", "Freiburg|de|SC Freiburg", "Hamburger SV|de", "Heidenheim|de|FC Heidenheim",
    "Hoffenheim|de|TSG Hoffenheim", "Mainz 05|de|Mainz", "RB Leipzig|de", "St. Pauli|de|St Pauli", "Union Berlin|de",
    "VfB Stuttgart|de", "Werder Bremen|de", "Wolfsburg|de|VfL Wolfsburg",
  ],
  "Ligue 1": [
    "Angers|fr", "Auxerre|fr", "Brest|fr", "Le Havre|fr", "Lens|fr", "Lille|fr", "Lorient|fr", "Lyon|fr", "Marseille|fr", "Metz|fr",
    "Monaco|mc|AS Monaco", "Nantes|fr", "Nice|fr", "Paris FC|fr", "Paris Saint-Germain|fr", "Rennes|fr", "Strasbourg|fr", "Toulouse|fr",
  ],
  "Primeira Liga": [
    "Benfica|pt", "Porto|pt|FC Porto", "Sporting CP|pt|Sporting Lisbon", "Braga|pt|SC Braga", "Vitória de Guimarães|pt|Vitoria Guimaraes",
    "Famalicão|pt|Famalicao", "Gil Vicente|pt", "Estoril|pt", "Moreirense|pt", "Rio Ave|pt", "Arouca|pt", "Casa Pia|pt", "Santa Clara|pt",
    "Estrela da Amadora|pt", "AVS|pt|AVS Futebol", "Nacional|pt|CD Nacional", "Tondela|pt", "Alverca|pt",
  ],
  Eredivisie: [
    "Ajax|nl", "PSV Eindhoven|nl", "Feyenoord|nl", "AZ Alkmaar|nl", "FC Twente|nl", "FC Utrecht|nl", "Go Ahead Eagles|nl",
    "NEC Nijmegen|nl", "Heerenveen|nl", "Sparta Rotterdam|nl", "Groningen|nl", "Fortuna Sittard|nl", "PEC Zwolle|nl",
    "Heracles Almelo|nl", "NAC Breda|nl", "Excelsior|nl", "Telstar|nl", "FC Volendam|nl",
  ],
  "Saudi Pro League": [
    "Al Hilal|sa", "Al Nassr|sa", "Al Ittihad|sa|Al-Ittihad", "Al Ahli|sa|Al-Ahli Saudi", "Al Qadsiah|sa", "Al Ettifaq|sa",
    "Al Shabab|sa|Al-Shabab", "Al Taawoun|sa", "Al Fateh|sa", "Al Khaleej|sa", "Al Fayha|sa", "Al Riyadh|sa", "Al Kholood|sa",
    "Al Okhdood|sa", "Damac|sa", "Al Hazem|sa", "Al Najma|sa", "NEOM|sa|NEOM SC",
  ],
  Europe: [
    "Celtic|gb-sct", "Rangers|gb-sct", "Galatasaray|tr", "Fenerbahçe|tr|Fenerbahce", "Beşiktaş|tr|Besiktas", "Club Brugge|be",
    "Anderlecht|be", "Union Saint-Gilloise|be|Union SG", "Red Bull Salzburg|at", "Sturm Graz|at", "Young Boys|ch", "Basel|ch|FC Basel",
    "Copenhagen|dk|FC Copenhagen", "Midtjylland|dk|FC Midtjylland", "Bodø/Glimt|no|Bodo/Glimt", "Shakhtar Donetsk|ua",
    "Dinamo Zagreb|hr", "Red Star Belgrade|rs", "Slavia Prague|cz", "Sparta Prague|cz", "Olympiacos|gr", "PAOK|gr",
    "Panathinaikos|gr", "Ferencváros|hu|Ferencvaros", "Qarabağ|az|Qarabag", "Kairat|kz|Kairat Almaty", "Pafos|cy|Pafos FC", "Malmö FF|se|Malmo FF",
  ],
};

export const basketball = {
  NBA: [
    "Atlanta Hawks|us", "Boston Celtics|us", "Brooklyn Nets|us", "Charlotte Hornets|us", "Chicago Bulls|us", "Cleveland Cavaliers|us",
    "Dallas Mavericks|us", "Denver Nuggets|us", "Detroit Pistons|us", "Golden State Warriors|us", "Houston Rockets|us", "Indiana Pacers|us",
    "Los Angeles Clippers|us", "Los Angeles Lakers|us", "Memphis Grizzlies|us", "Miami Heat|us", "Milwaukee Bucks|us",
    "Minnesota Timberwolves|us", "New Orleans Pelicans|us", "New York Knicks|us", "Oklahoma City Thunder|us", "Orlando Magic|us",
    "Philadelphia 76ers|us", "Phoenix Suns|us", "Portland Trail Blazers|us", "Sacramento Kings|us", "San Antonio Spurs|us",
    "Toronto Raptors|ca", "Utah Jazz|us", "Washington Wizards|us",
  ],
  EuroLeague: [
    "Anadolu Efes|tr", "AS Monaco Basket|mc|AS Monaco Basket", "Baskonia|es", "Bayern Munich Basketball|de|Bayern Munich Basketball",
    "Crvena zvezda|rs|KK Crvena Zvezda", "Dubai Basketball|ae", "Fenerbahçe Basketball|tr|Fenerbahce Basketball", "Hapoel Tel Aviv|il|Hapoel Tel Aviv BC",
    "LDLC ASVEL|fr|ASVEL", "Maccabi Tel Aviv|il|Maccabi Tel Aviv BC", "Olimpia Milano|it", "Panathinaikos Basketball|gr|Panathinaikos BC",
    "Paris Basketball|fr", "Partizan|rs|KK Partizan", "Olympiacos Basketball|gr|Olympiacos BC", "Real Madrid Basketball|es|Real Madrid Baloncesto",
    "Valencia Basket|es", "Barcelona Basketball|es|FC Barcelona Basquet", "Žalgiris Kaunas|lt|Zalgiris Kaunas", "Virtus Bologna|it",
  ],
  "Lebanese Basketball League": [
    "Al Riyadi|lb|Al Riyadi Club Beirut", "Sagesse|lb|Sagesse Basketball", "Homenetmen Beirut|lb", "Beirut Club|lb", "Dynamo Lebnaniyeh|lb",
    "Champville|lb", "Antranik|lb", "Hoops Club|lb", "Mayrouba|lb", "Byblos|lb",
  ],
};

export const tennis = {
  ATP: [
    "Jannik Sinner|it", "Carlos Alcaraz|es", "Alexander Zverev|de", "Novak Djokovic|rs", "Taylor Fritz|us", "Jack Draper|gb",
    "Alex de Minaur|au", "Lorenzo Musetti|it", "Holger Rune|dk", "Casper Ruud|no", "Daniil Medvedev|", "Andrey Rublev|",
    "Ben Shelton|us", "Tommy Paul|us", "Frances Tiafoe|us", "Felix Auger-Aliassime|ca", "Karen Khachanov|", "Jakub Menšík|cz",
    "Arthur Fils|fr", "Stefanos Tsitsipas|gr", "Grigor Dimitrov|bg", "Alejandro Davidovich Fokina|es", "Ugo Humbert|fr",
    "Francisco Cerúndolo|ar", "Tomáš Macháč|cz", "Jiří Lehečka|cz", "Denis Shapovalov|ca", "Sebastian Korda|us", "Alexander Bublik|kz",
    "Flavio Cobolli|it", "Brandon Nakashima|us", "Alex Michelsen|us", "Learner Tien|us", "João Fonseca|br", "Hubert Hurkacz|pl",
    "Matteo Berrettini|it", "Lorenzo Sonego|it", "Luciano Darderi|it", "Gabriel Diallo|ca", "Corentin Moutet|fr", "Alexei Popyrin|au",
    "Jordan Thompson|au", "Alejandro Tabilo|cl", "Sebastián Báez|ar", "Tomás Martín Etcheverry|ar", "Francisco Comesaña|ar",
    "Nuno Borges|pt", "Zizou Bergs|be", "David Goffin|be", "Cameron Norrie|gb", "Jacob Fearnley|gb", "Arthur Rinderknech|fr",
    "Giovanni Mpetshi Perricard|fr", "Valentin Vacherot|mc", "Arthur Cazaux|fr", "Kei Nishikori|jp", "Yoshihito Nishioka|jp",
    "Botic van de Zandschulp|nl", "Tallon Griekspoor|nl", "Jesper de Jong|nl", "Marcos Giron|us", "Reilly Opelka|us",
    "Jenson Brooksby|us", "Aleksandar Vukic|au", "Christopher O'Connell|au", "Rinky Hijikata|au", "Adam Walton|au",
    "Miomir Kecmanović|rs", "Hamad Medjedovic|rs", "Laslo Djere|rs", "Roberto Bautista Agut|es", "Pedro Martínez|es", "Jaume Munar|es",
    "Martín Landaluce|es", "Daniel Altmaier|de", "Jan-Lennard Struff|de", "Yannick Hanfmann|de", "Fábián Marozsán|hu",
    "Márton Fucsovics|hu", "Kamil Majchrzak|pl", "Stan Wawrinka|ch", "Marin Čilić|hr", "Sebastian Ofner|at", "Alexander Shevchenko|kz",
    "Roman Safiullin|", "Juncheng Shang|cn", "Zhizhen Zhang|cn", "Yunchaokete Bu|cn", "Mariano Navone|ar", "Camilo Ugo Carabelli|ar",
    "Damir Džumhur|ba", "Quentin Halys|fr", "Benjamin Bonzi|fr", "Terence Atmane|fr", "Jérôme Kym|ch", "Ethan Quinn|us",
    "Aleksandar Kovacevic|us", "Nicolás Jarry|cl", "Cristian Garín|cl", "Emil Ruusuvuori|fi", "Otto Virtanen|fi",
  ],
  WTA: [
    "Aryna Sabalenka|", "Iga Świątek|pl", "Coco Gauff|us", "Amanda Anisimova|us", "Jessica Pegula|us", "Elena Rybakina|kz",
    "Madison Keys|us", "Mirra Andreeva|", "Jasmine Paolini|it", "Zheng Qinwen|cn", "Emma Navarro|us", "Paula Badosa|es",
    "Elina Svitolina|ua", "Karolína Muchová|cz", "Barbora Krejčíková|cz", "Ekaterina Alexandrova|", "Daria Kasatkina|au",
    "Clara Tauson|dk", "Belinda Bencic|ch", "Liudmila Samsonova|", "Diana Shnaider|", "Beatriz Haddad Maia|br", "Jeļena Ostapenko|lv",
    "Linda Nosková|cz", "Marta Kostyuk|ua", "Leylah Fernandez|ca", "Victoria Mboko|ca", "Donna Vekić|hr", "Emma Raducanu|gb",
    "Sofia Kenin|us", "Elise Mertens|be", "Magdalena Fręch|pl", "Anna Kalinskaya|", "Veronika Kudermetova|", "Dayana Yastremska|ua",
    "Naomi Osaka|jp", "Marie Bouzková|cz", "Ons Jabeur|tn", "Victoria Azarenka|", "Maria Sakkari|gr", "Jessica Bouzas Maneiro|es",
    "Ashlyn Krueger|us", "McCartney Kessler|us", "Peyton Stearns|us", "Hailey Baptiste|us", "Danielle Collins|us", "Iva Jović|us",
    "Alycia Parks|us", "Katie Boulter|gb", "Sonay Kartal|gb", "Rebecca Šramková|sk", "Anastasia Potapova|", "Anna Blinkova|",
    "Polina Kudermetova|", "Kamilla Rakhimova|", "Yulia Putintseva|kz", "Elisabetta Cocciaretto|it", "Lucia Bronzetti|it",
    "Camila Osorio|co", "Maya Joint|au", "Ajla Tomljanović|au", "Kimberly Birrell|au", "Olga Danilović|rs", "Eva Lys|de",
    "Laura Siegemund|de", "Tatjana Maria|de", "Jule Niemeier|de", "Wang Xinyu|cn", "Yuan Yue|cn", "Zhang Shuai|cn", "Wang Xiyu|cn",
    "Linda Fruhvirtová|cz", "Kateřina Siniaková|cz", "Sára Bejlek|cz", "Tereza Valentová|cz", "Viktorija Golubic|ch", "Jil Teichmann|ch",
    "Cristina Bucșa|es", "Sorana Cîrstea|ro", "Jaqueline Cristian|ro", "Anca Todoni|ro", "Elena-Gabriela Ruse|ro", "Varvara Gracheva|fr",
    "Diane Parry|fr", "Loïs Boisson|fr", "Lulu Sun|nz", "Moyuka Uchijima|jp", "Suzan Lamens|nl", "Anhelina Kalinina|ua",
    "Yuliia Starodubtseva|ua", "Viktoriya Tomova|bg", "Ann Li|us", "Bernarda Pera|us", "Taylor Townsend|us", "Robin Montgomery|us",
    "Alexandra Eala|ph", "Janice Tjen|id", "Emiliana Arango|co", "Renata Zarazúa|mx", "Laura Pigossi|br",
  ],
};

export const darts = {
  PDC: [
    "Luke Littler|gb-eng", "Luke Humphries|gb-eng", "Michael van Gerwen|nl", "Gerwyn Price|gb-wls", "Michael Smith|gb-eng",
    "Rob Cross|gb-eng", "Stephen Bunting|gb-eng", "Jonny Clayton|gb-wls", "Danny Noppert|nl", "Gary Anderson|gb-sct",
    "Peter Wright|gb-sct", "Nathan Aspinall|gb-eng", "Damon Heta|au", "Chris Dobey|gb-eng", "Josh Rock|gb-nir", "Dave Chisnall|gb-eng",
    "Gian van Veen|nl", "Martin Schindler|de", "James Wade|gb-eng", "Dimitri Van den Bergh|be", "Ross Smith|gb-eng", "Ryan Searle|gb-eng",
    "Joe Cullen|gb-eng", "Dirk van Duijvenbode|nl", "Mike De Decker|be", "Daryl Gurney|gb-nir", "Krzysztof Ratajski|pl",
    "Jermaine Wattimena|nl", "Andrew Gilding|gb-eng", "Luke Woodhouse|gb-eng", "Ritchie Edhouse|gb-eng", "Ryan Joyce|gb-eng",
    "Callan Rydz|gb-eng", "Cameron Menzies|gb-sct", "Ricardo Pietreczko|de", "Mensur Suljović|at", "Gabriel Clemens|de",
    "Raymond van Barneveld|nl", "Wessel Nijman|nl", "Kevin Doets|nl", "Jeffrey de Graaf|se", "Dylan Slevin|ie", "William O'Connor|ie",
    "Keane Barry|ie", "Brendan Dolan|gb-nir", "Mickey Mansell|gb-nir", "Martin Lukeman|gb-eng", "Scott Williams|gb-eng",
    "Jim Williams|gb-wls", "Ian White|gb-eng", "Madars Razma|lv", "Karel Sedláček|cz", "Niels Zonneveld|nl", "Danny Jansen|nl",
    "Thibault Tricole|fr", "José de Sousa|pt", "Rowby-John Rodriguez|at", "Kim Huybrechts|be", "Steve Beaton|gb-eng",
    "Matt Campbell|ca", "Paolo Nebrida|ph", "Leonard Gates|us", "Simon Whitlock|au", "Haupai Puha|nz", "Beau Greaves|gb-eng",
    "Fallon Sherrock|gb-eng",
  ],
};
