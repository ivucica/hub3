import { PurposeCodeInfo } from '../types/payment';

export const PURPOSE_CODES: PurposeCodeInfo[] = [
  // Komunalne usluge & režije
  { code: 'GASB', name: 'Račun za plin', category: 'Komunalne usluge', definition: 'Transakcija se odnosi na plaćanje računa za potrošnju prirodnog plina.' },
  { code: 'ELEC', name: 'Račun za električnu energiju', category: 'Komunalne usluge', definition: 'Transakcija se odnosi na plaćanje računa za električnu energiju.' },
  { code: 'WTER', name: 'Račun za vodu', category: 'Komunalne usluge', definition: 'Transakcija se odnosi na plaćanje računa za vodoopskrbu i odvodnju.' },
  { code: 'ENRG', name: 'Energija', category: 'Komunalne usluge', definition: 'Transakcija se odnosi na plaćanje energije općenito.' },
  { code: 'CBTV', name: 'Račun za kabelsku TV', category: 'Komunalne usluge', definition: 'Transakcija se odnosi na plaćanje računa za kabelsku ili satelitsku televiziju.' },
  { code: 'PHON', name: 'Račun za telefon', category: 'Komunalne usluge', definition: 'Transakcija se odnosi na plaćanje telefonskih i mobilnih usluga.' },
  { code: 'NWCM', name: 'Mrežna komunikacija', category: 'Komunalne usluge', definition: 'Transakcija se odnosi na plaćanje interneta i mrežnih komunikacija.' },
  { code: 'NWCH', name: 'Troškovi za mrežu', category: 'Komunalne usluge', definition: 'Transakcija se odnosi na plaćanje troškova za korištenje mreže.' },
  { code: 'OTLC', name: 'Ostale telekomunikacijske usluge', category: 'Komunalne usluge', definition: 'Transakcija se odnosi na ostale telekomunikacijske usluge.' },

  // Općenito & Troškovi
  { code: 'COST', name: 'Troškovi', category: 'Općenito', definition: 'Transakcija se odnosi na opće operativne i tekuće troškove.' },
  { code: 'RENT', name: 'Najam / Zakup', category: 'Općenito', definition: 'Transakcija predstavlja plaćanje najamnine ili zakupa stambenog ili poslovnog prostora.' },
  { code: 'INSM', name: 'Rata / Obrok', category: 'Općenito', definition: 'Transakcija se odnosi na plaćanje ugovorene rate ili obroka.' },
  { code: 'IHRP', name: 'Plaćanje rate pri kupnji na otplatu', category: 'Općenito', definition: 'Transakcija predstavlja otplatu rate kod kupnje na obročno plaćanje.' },
  { code: 'ADVA', name: 'Predujam / Avans', category: 'Općenito', definition: 'Transakcija predstavlja plaćanje predujma ili avansa za robu/uslugu.' },
  { code: 'REFU', name: 'Povrat sredstava', category: 'Općenito', definition: 'Transakcija predstavlja povrat prethodno uplaćenih sredstava.' },
  { code: 'STDY', name: 'Studiranje / Školarina', category: 'Općenito', definition: 'Transakcija se odnosi na plaćanje troškova studiranja, školarine ili edukacije.' },
  { code: 'TELI', name: 'Plaćanje putem telefona', category: 'Općenito', definition: 'Transakcija se odnosi na plaćanje inicirano telefonom.' },
  { code: 'WEBI', name: 'Plaćanje putem interneta', category: 'Općenito', definition: 'Transakcija se odnosi na plaćanje inicirano putem interneta.' },
  { code: 'MSVC', name: 'Višenamjenske usluge', category: 'Općenito', definition: 'Transakcija se odnosi na plaćanje višenamjenskih mješovitih usluga.' },
  { code: 'NOWS', name: 'Nenavedeno', category: 'Općenito', definition: 'Plaćanje za usluge koje nisu drugdje specificirane.' },
  { code: 'OFEE', name: 'Početna naknada (Opening fee)', category: 'Općenito', definition: 'Transakcija se odnosi na plaćanje početne ili pristupne naknade.' },
  { code: 'OTHR', name: 'Ostalo', category: 'Općenito', definition: 'Druga vrsta plaćanja bez specifične kategorizacije.' },
  { code: 'PTSP', name: 'Uvjeti plaćanja', category: 'Općenito', definition: 'Transakcija se odnosi na specifikaciju posebnih uvjeta plaćanja.' },
  { code: 'RCPT', name: 'Plaćanje potvrde', category: 'Općenito', definition: 'Transakcija se odnosi na izdavanje službene potvrde o provedenom plaćanju.' },
  { code: 'CFEE', name: 'Naknada za opoziv / storno', category: 'Općenito', definition: 'Transakcija se odnosi na plaćanje naknade za opoziv ili storniranje transakcije.' },

  // Komercijalna plaćanja & Dobavljači
  { code: 'SUPP', name: 'Plaćanje dobavljaču', category: 'Komercijalna plaćanja', definition: 'Plaćanje računa dobavljaču za isporučena dobra ili izvršene poslove.' },
  { code: 'GDDS', name: 'Kupoprodaja roba', category: 'Komercijalna plaćanja', definition: 'Transakcija se odnosi na komercijalnu kupovinu ili prodaju roba.' },
  { code: 'SCVE', name: 'Kupoprodaja usluga', category: 'Komercijalna plaćanja', definition: 'Transakcija se odnosi na kupovinu i prodaju komercijalnih usluga.' },
  { code: 'GDSV', name: 'Kupoprodaja roba i usluga', category: 'Komercijalna plaćanja', definition: 'Kombinirana kupoprodaja roba i pratećih usluga.' },
  { code: 'SUBS', name: 'Pretplata', category: 'Komercijalna plaćanja', definition: 'Plaćanje periodične pretplate na novine, softver ili periodične usluge.' },
  { code: 'TRAD', name: 'Trgovačke usluge', category: 'Komercijalna plaćanja', definition: 'Transakcija se odnosi na plaćanje ugovorenih trgovačkih usluga.' },
  { code: 'COMC', name: 'Komercijalno plaćanje', category: 'Komercijalna plaćanja', definition: 'Plaćanje komercijalnog kredita ili duga po trgovačkom poslu.' },
  { code: 'BEXP', name: 'Poslovni troškovi', category: 'Komercijalna plaćanja', definition: 'Operativni poslovni izdaci poduzeća.' },
  { code: 'AREN', name: 'Knjiženje potraživanja', category: 'Komercijalna plaćanja', definition: 'Transakcija se odnosi na namirenje ili knjiženje otvorenih potraživanja.' },
  { code: 'CPYR', name: 'Autorsko pravo', category: 'Komercijalna plaćanja', definition: 'Plaćanje naknade za korištenje autorskog djela.' },
  { code: 'ROYA', name: 'Tantijemi / Royalty', category: 'Komercijalna plaćanja', definition: 'Isplata prihoda i tantijema po osnovu autorskih i srodnih prava.' },
  { code: 'LICF', name: 'Naknada za licencu', category: 'Komercijalna plaćanja', definition: 'Plaćanje prava korištenja softvera ili industrijske licence.' },
  { code: 'AGRT', name: 'Poljoprivredni transfer', category: 'Komercijalna plaćanja', definition: 'Namjensko plaćanje u poljoprivrednoj proizvodnji.' },

  // Porezi & Javna davanja
  { code: 'TAXS', name: 'Plaćanje poreza', category: 'Porezi i država', definition: 'Opće plaćanje poreznih obveza Poreznoj upravi.' },
  { code: 'VATX', name: 'Porez na dodanu vrijednost (PDV)', category: 'Porezi i država', definition: 'Uplata poreza na dodanu vrijednost u državni proračun.' },
  { code: 'INTX', name: 'Porez na dohodak', category: 'Porezi i država', definition: 'Plaćanje predujma ili konačnog poreza na dohodak.' },
  { code: 'NITX', name: 'Porez na neto dohodak', category: 'Porezi i država', definition: 'Plaćanje specifičnog poreza na neto dohodak.' },
  { code: 'ESTX', name: 'Porez na nasljedstvo', category: 'Porezi i država', definition: 'Plaćanje poreza na nasljedstva i darove.' },
  { code: 'HSTX', name: 'Porez na nekretnine / prostor', category: 'Porezi i država', definition: 'Plaćanje poreza na promet nekretnina ili stambeni prostor.' },
  { code: 'WHLD', name: 'Porez po odbitku', category: 'Porezi i država', definition: 'Uplata poreza po odbitku (withholding tax).' },
  { code: 'GOVT', name: 'Plaćanje državi / tijelima', category: 'Porezi i država', definition: 'Plaćanje upravnih pristojbi ili obveza državnim tijelima.' },

  // Plaće, naknade & socijalna davanja
  { code: 'SALA', name: 'Plaće (isplata)', category: 'Plaća i naknade', definition: 'Redovita isplata plaće zaposlenicima.' },
  { code: 'PAYR', name: 'Platni spisak', category: 'Plaća i naknade', definition: 'Isplata plaća prema skupnom platnom spisku.' },
  { code: 'PENS', name: 'Mirovine', category: 'Plaća i naknade', definition: 'Isplata mirovinskih primanja korisnicima.' },
  { code: 'BONU', name: 'Novčana nagrada (bonus)', category: 'Plaća i naknade', definition: 'Isplata stimulacije, bonusa ili nagrade za rad.' },
  { code: 'COMM', name: 'Provizija', category: 'Plaća i naknade', definition: 'Isplata posredničke ili prodajne provizije.' },
  { code: 'ALMY', name: 'Alimentacija', category: 'Plaća i naknade', definition: 'Plaćanje uzdržavanja / alimentacije za dijete ili bivšeg supružnika.' },
  { code: 'BECH', name: 'Dječji doplatak', category: 'Plaća i naknade', definition: 'Isplata doplatka za pomoć pri uzdržavanju djece.' },
  { code: 'BENE', name: 'Naknada za nezaposlenost / invaliditet', category: 'Plaća i naknade', definition: 'Socijalna naknada za nezaposlene osobe ili osobe s invaliditetom.' },
  { code: 'SSBE', name: 'Socijalna pomoć', category: 'Plaća i naknade', definition: 'Državna socijalna potpora i pomoći građanima.' },
  { code: 'PRCP', name: 'Plaćanje troškova radnika', category: 'Plaća i naknade', definition: 'Nadoknada putnih ili terenskih troškova djelatnicima.' },

  // Financije & Krediti
  { code: 'LOAN', name: 'Zajam / Krediti (odobrenje)', category: 'Financije', definition: 'Isplata odobrenog kredita ili zajma korisniku.' },
  { code: 'LOAR', name: 'Otplata zajma / kredita', category: 'Financije', definition: 'Plaćanje mjesečne rate ili povrata glavnice zajma/kredita.' },
  { code: 'HLRP', name: 'Otplata stambenog kredita', category: 'Financije', definition: 'Mjesečna anuitetna otplata stambenog kredita.' },
  { code: 'CLPR', name: 'Otplata auto kredita', category: 'Financije', definition: 'Otplata glavnice kredita ili leasinga za automobil.' },
  { code: 'INTE', name: 'Kamata', category: 'Financije', definition: 'Plaćanje obračunatih redovnih ili zateznih kamata.' },
  { code: 'RINP', name: 'Obročno plaćanje (financije)', category: 'Financije', definition: 'Ponavljajuća financijska rata u redovitim intervalima.' },
  { code: 'DBTC', name: 'Plaćanje putem terećenja', category: 'Financije', definition: 'Plaćanje putem trajnog naloga ili izravnog terećenja.' },
  { code: 'INSU', name: 'Premija osiguranja', category: 'Financije', definition: 'Opća uplata police osiguranja osiguravajućem društvu.' },
  { code: 'INPC', name: 'Osiguranje za vozilo (auto kasko/obvezno)', category: 'Financije', definition: 'Plaćanje premije osiguranja motornih vozila.' },
  { code: 'LIFI', name: 'Životno osiguranje', category: 'Financije', definition: 'Uplata premije police životnog osiguranja.' },
  { code: 'PPTI', name: 'Osiguranje imovine', category: 'Financije', definition: 'Osiguranje kuće, stana ili poslovne imovine.' },
  { code: 'LBRI', name: 'Osiguranje od ozljede na radu', category: 'Financije', definition: 'Uplata premije osiguranja zaposlenika od nezgode na radu.' },
  { code: 'GOVI', name: 'Državno osiguranje', category: 'Financije', definition: 'Plaćanje obveznih državnih osiguranja.' },

  // Zdravstvo
  { code: 'MDCS', name: 'Zdravstvene usluge', category: 'Zdravstvo', definition: 'Plaćanje liječničkih pregleda, dijagnostike i zdravstvenih usluga.' },
  { code: 'DNTS', name: 'Zubarske usluge', category: 'Zdravstvo', definition: 'Plaćanje stomatoloških zahvata i dentalne protetike.' },
  { code: 'HLTI', name: 'Zdravstveno osiguranje', category: 'Zdravstvo', definition: 'Dopunsko ili dodatno zdravstveno osiguranje.' },
  { code: 'HSPC', name: 'Bolnička njega', category: 'Zdravstvo', definition: 'Troškovi bolničkog liječenja i stacionarne skrbi.' },
  { code: 'DMEQ', name: 'Medicinska oprema', category: 'Zdravstvo', definition: 'Kupnja ili najam medicinskih pomagala i opreme.' },
  { code: 'VIEW', name: 'Oftalmološke usluge', category: 'Zdravstvo', definition: 'Pregledi vida, dioptrijske naočale i leće.' },
  { code: 'HLTC', name: 'Kućna njega bolesnika', category: 'Zdravstvo', definition: 'Usluge patronaže i medicinske njege u kući.' },
  { code: 'LTCF', name: 'Ustanova dugoročne skrbi', category: 'Zdravstvo', definition: 'Smještaj i skrb u domovima za starije ili specijaliziranim ustanovama.' },

  // Prijevoz & Putovanja
  { code: 'AIRB', name: 'Zračni prijevoz', category: 'Prijevoz', definition: 'Plaćanje zrakoplovnih karata ili zračnog teretnog prijevoza.' },
  { code: 'BUSB', name: 'Autobusni prijevoz', category: 'Prijevoz', definition: 'Autobusne karte i najam autobusa.' },
  { code: 'FERB', name: 'Trajektni / Pomorski prijevoz', category: 'Prijevoz', definition: 'Karte za trajekt, brodski prijevoz i lučke pristojbe.' },
  { code: 'RLWY', name: 'Željeznički prijevoz', category: 'Prijevoz', definition: 'Vozne karte i usluge željezničkog prometa.' },

  // Potrošač & Donacije
  { code: 'CHAR', name: 'Plaćanje u dobrotvorne svrhe', category: 'Potrošač i donacije', definition: 'Humanitarne donacije i prilozi neprofitnim udrugama.' },
  { code: 'COMT', name: 'Konsolidirano plaćanje treće strane', category: 'Potrošač i donacije', definition: 'Plaćanje koje obavlja ovlaštena treća strana u ime potrošača.' },

  // Ulaganje & Štednja
  { code: 'SAVG', name: 'Štednja', category: 'Ulaganje', definition: 'Prijenos sredstava na štedni ili namjenski depozitni račun.' },
  { code: 'SECU', name: 'Vrijednosni papiri', category: 'Ulaganje', definition: 'Kupovina dionica, obveznica ili udjela u fondovima.' },
  { code: 'DIVD', name: 'Dividenda', category: 'Ulaganje', definition: 'Isplata dobiti i dividendi dioničarima.' },
  { code: 'ANNI', name: 'Anuitet ulaganja', category: 'Ulaganje', definition: 'Plaćanje anuiteta ulaganja ili mirovinske rente.' },
];
