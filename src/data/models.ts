import { ModelInfo } from '../types/payment';

export const PAYMENT_MODELS: ModelInfo[] = [
  {
    code: 'HR00',
    name: 'Slobodan unos (bez kontrole)',
    structure: 'P1 - P2 - P3',
    description: 'Poziv na broj bez izračuna kontrolnog broja. Može sadržavati do tri podatka odvojena crticom.',
    details: 'Koristi se kada korisnik ne želi da se sadržaj kontrolira putem kontrolnog broja. Sadržaj može imati 1 do 3 podatka (P1 - P2 - P3), do 22 znaka ukupno.',
    controlModule: 'Bez kontrole'
  },
  {
    code: 'HR01',
    name: 'Opći model (jedinstveni kontrolni broj)',
    structure: '(P1 - P2 - P3)K',
    description: 'Najčešći model u RH. Cijeli sadržaj poziva na broj kontroliran je jednim kontrolnim brojem na kraju.',
    details: 'Cjelokupan niz znamenaka provjerava se algoritmom MOD11INI (ponderi od 2 naviše). Posljednja znamenka zadnjeg podatka je kontrolni broj K.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR02',
    name: 'Kontrola P2 i P3 odvojeno',
    structure: 'P1 - (P2)K - (P3)K',
    description: 'P1 je bez kontrole, dok podaci P2 i P3 imaju zasebne kontrolne brojeve po MOD11.',
    details: 'Koristi se kada je P1 fiksna ili identifikacijska oznaka bez kontrolnog broja, a podaci P2 i P3 se kontroliraju pojedinačno.',
    controlModule: 'MOD11INI (za P2 i P3)'
  },
  {
    code: 'HR03',
    name: 'Svi podaci kontrolirani zasebno',
    structure: '(P1)K - (P2)K - (P3)K',
    description: 'Svaki pojedini podatak (P1, P2 i P3) ima vlastiti kontrolni broj na zadnjem mjestu.',
    details: 'Svaki podatak provjerava se neovisno po algoritmu MOD11INI.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR04',
    name: 'Kontrola P1 i P3',
    structure: '(P1)K - P2 - (P3)K',
    description: 'Podaci P1 i P3 sadrže kontrolne brojeve, dok je P2 slobodan podatak.',
    details: 'P2 se ne kontrolira kontrolnim brojem. P1 i P3 se kontroliraju zasebno po MOD11INI.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR05',
    name: 'Porezi / OIB uplatitelja (ISO 7064)',
    structure: '(P1)K - P2 ili P2(K) - P3',
    description: 'P1 je šifra općine/grada s kontrolnim brojem, a P2 je 11-znamenkasti OIB poreznog obveznika.',
    details: 'Često se koristi za uplate poreza i doprinosa gradovima i općinama. Ako je P2 OIB, provjerava se po međunarodnom standardu ISO 7064 MOD(11, 10).',
    controlModule: 'MOD11INI / ISO 7064'
  },
  {
    code: 'HR06',
    name: 'Zajednička kontrola P2 i P3',
    structure: 'P1 - (P2 - P3)K',
    description: 'P1 je slobodan, a za spojeni niz P2 i P3 računa se zajednički kontrolni broj na kraju P3.',
    details: 'P3 ne smije imati vodeće nule. Kontrola se provodi prema MOD11INI.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR07',
    name: 'Kontrola samo P2',
    structure: 'P1 - (P2)K - P3',
    description: 'Samo drugi podatak (P2) podliježe provjeri kontrolnog broja.',
    details: 'P1 i P3 se unose proizvoljno bez kontrolnog broja.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR08',
    name: 'Zajednički P1-P2 i zasebni P3',
    structure: '(P1 - P2)K - (P3)K',
    description: 'P1 i P2 imaju zajednički kontrolni broj na kraju P2, dok P3 ima svoj zasebni kontrolni broj.',
    details: 'Podatak P2 nema vodećih nula.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR09',
    name: 'Zajednički P1 i P2',
    structure: '(P1 - P2)K - P3',
    description: 'P1 i P2 se kontroliraju zajedničkim kontrolnim brojem, P3 je bez kontrole.',
    details: 'Podatak P2 nema vodećih nula.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR10',
    name: 'Zasebni P1 i zajednički P2-P3',
    structure: '(P1)K - (P2 - P3)K',
    description: 'P1 ima svoj kontrolni broj, a P2 i P3 zajednički kontrolni broj na kraju P3.',
    details: 'Podatak P3 nema vodećih nula.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR11',
    name: 'Kontrola P1 i P2',
    structure: '(P1)K - (P2)K - P3',
    description: 'P1 i P2 imaju zasebne kontrolne brojeve, P3 je bez kontrole.',
    details: 'Oba podatka se kontroliraju po modulu MOD11INI.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR12',
    name: 'JMBG kontrola u P1 (13 znamenaka)',
    structure: '(P1)K - P2 - P3',
    description: 'P1 je jedinstveni matični broj građana (JMBG) od 13 znamenaka provjeren specifičnim ponderima.',
    details: 'Algoritam JMBG MOD11 ponderira s desna na lijevo utezima 1 do 7 pa ponovno od 2 do 7. Zbroj mora biti djeljiv s 11.',
    controlModule: 'MOD11JMB'
  },
  {
    code: 'HR13',
    name: 'Algoritam MOD11P7 (počinje s 3)',
    structure: '(P1)K - P2 - P3',
    description: 'P1 ima točno 10 znamenaka, počinje s 3, a zadnja je kontrolni broj po algoritmu MOD11P7.',
    details: 'Ponderira se slijeva nadesno redom: 4, 3, 2, 7, 6, 5, 4, 3, 2.',
    controlModule: 'MOD11P7'
  },
  {
    code: 'HR14',
    name: 'Zagrebačka banka (ZABA) MOD10ZB',
    structure: '(P1)K - P2 - P3',
    description: 'Model specifičan za ZABA račune s kontrolom P1 primjenom MODUL 10 (utezi 1 i 2).',
    details: 'P1 ima 10 znamenaka, zadnja znamenka je kontrolni broj dobiven iz ostatka dijeljenja zbroja s 10.',
    controlModule: 'MOD10ZB'
  },
  {
    code: 'HR15',
    name: 'Modul 10 za P1 i P2',
    structure: '(P1)K - (P2)K',
    description: 'P1 ima točno 8 znamenaka, P2 točno 11 znamenaka (oba po Modulu 10). P3 se ne unosi.',
    details: 'Utezi se izmjenjuju s desna ulijevo 2 i 1.',
    controlModule: 'MOD10'
  },
  {
    code: 'HR16',
    name: 'Fiksne duljine 5 - 4 - 8',
    structure: '(P1)K - (P2)K - P3',
    description: 'P1 ima 5 znamenaka, P2 ima 4 znamenke, P3 ima 8 znamenaka.',
    details: 'P1 i P2 se provjeravaju s MOD11INI.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR17',
    name: 'ISO 7064 za P1',
    structure: '(P1)K - P2 - P3',
    description: 'P1 se provjerava prema međunarodnoj normi ISO 7064 (11, 10).',
    details: 'Duljina P1 je do 12 znamenaka. P2 i P3 su varijabilni bez kontrole.',
    controlModule: 'ISO 7064 (11, 10)'
  },
  {
    code: 'HR18',
    name: 'MOD11P7 varijabilni P1',
    structure: '(P1)K - P2 - P3',
    description: 'P1 ima do 12 znamenaka s kontrolnim brojem prema algoritmu modela 13.',
    details: 'Primjenjuje isti ponderirani algoritam kao HR13.',
    controlModule: 'MOD11P7'
  },
  {
    code: 'HR19',
    name: 'FINA ovrhe i naknade',
    structure: '(P1)K - (P2)K',
    description: 'Koristi se za plaćanje FINA naknada po Zakonu o provedbi ovrhe. P2 je 11-znamenkasti OIB.',
    details: 'P1 ima do 10 znamenaka (MOD11INI), P2 je OIB provjeren s ISO 7064 (11, 10).',
    controlModule: 'MOD11INI / ISO 7064'
  },
  {
    code: 'HR23',
    name: 'Proračunski prihodi (4 podatka)',
    structure: '(P1)K - P2 - P3 - P4',
    description: 'P1 ima 4 znamenke (šifra vrste prihoda, počinje s brojem 6). P2, P3 i P4 zajedno do 15 znamenaka.',
    details: 'Sukladno Naputku o uplaćivanju prihoda proračuna i doprinosa.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR24',
    name: 'Proračunski prihodi (P2 do 13)',
    structure: '(P1)K - P2 - P3 - P4',
    description: 'P1 je šifra vrste prihoda (4 znamenke). P2 može imati do 13 znamenaka.',
    details: 'Podaci nakon P1 nisu pod kontrolnim brojem.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR26',
    name: 'Proračunski prihodi s OIB-om',
    structure: '(P1)K - (P2)K - (P3)K - P4',
    description: 'P1 šifra prihoda (4 znam.), P2 i P3 s kontrolnim brojevima (mogu biti OIB 11 znam.).',
    details: 'Ako je P2 ili P3 OIB, provjerava se po ISO 7064 (11, 10).',
    controlModule: 'MOD11INI / ISO 7064'
  },
  {
    code: 'HR27',
    name: 'Proračunski prihodi u dva podatka',
    structure: '(P1)K - (P2)K',
    description: 'P1 je šifra prihoda (4 znam.), P2 varijabilne duljine s kontrolnim brojem.',
    details: 'Oba podatka se provjeravaju s MOD11INI.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR28',
    name: 'Proračunski prihodi (4 - 3 - 6 - do 6)',
    structure: '(P1)K - (P2)K - (P3)K - P4',
    description: 'P1 (4 zn.), P2 podvrsta prihoda (3 zn.), P3 (6 zn.), P4 (do 6 zn.).',
    details: 'P1, P2 i P3 se kontroliraju po MOD11INI.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR29',
    name: 'Proračunski prihodi u tri podatka',
    structure: '(P1)K - (P2)K - (P3)K',
    description: 'P1 (4 zn.), P2 i P3 varijabilnih duljina s pojedinačnim kontrolnim brojevima.',
    details: 'Sva tri podatka kontroliraju se po MOD11INI.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR30',
    name: 'Državni proračun - rashodi',
    structure: 'P1 - P2 - P3',
    description: 'Isplata rashoda s računa Državnog proračuna. P1 ima 10 znamenaka, P2 točno 4, P3 do 6.',
    details: 'Koristi se za evidentiranje i storniranje rashoda riznice. Nema kontrolnog broja.',
    controlModule: 'Bez kontrole'
  },
  {
    code: 'HR31',
    name: 'Jedinstveni račun riznice i HZZO',
    structure: '(P1)K - P2 - P3 - P4',
    description: 'P1 je šifra rashoda po ekonomskoj klasifikaciji (do 6 znamenaka) s ISO 7064 kontrolom.',
    details: 'P2, P3 i P4 nisu pod kontrolom.',
    controlModule: 'ISO 7064 (11, 10)'
  },
  {
    code: 'HR33',
    name: 'Povrat u državni proračun / HZZO',
    structure: '(P1)K - (P2)K - P3',
    description: 'P1 je ekonomska klasifikacija, P2 šifra aktivnosti iz proračuna (do 7 zn.).',
    details: 'P1 i P2 se kontroliraju prema ISO 7064 (11, 10).',
    controlModule: 'ISO 7064 (11, 10)'
  },
  {
    code: 'HR34',
    name: 'Plaće proračunskih korisnika',
    structure: '(P1)K - (P2)K - (P3)K',
    description: 'Isplata plaća s računa posebnih namjena (tip 15). P1 ekonomska, P2 aktivnost, P3 šifra korisnika iz registra (do 5 zn.).',
    details: 'Sva tri podatka se kontroliraju s ISO 7064 (11, 10).',
    controlModule: 'ISO 7064 (11, 10)'
  },
  {
    code: 'HR35',
    name: 'OIB poreznog obveznika u P2',
    structure: '(P1)K - (P2)K',
    description: 'P1 ima do 10 znamenaka s MOD11INI, P2 je 11-znamenkasti OIB poreznog obveznika (ISO 7064).',
    details: 'Standardni format za identifikaciju uplatitelja ili obveznika.',
    controlModule: 'MOD11INI / ISO 7064'
  },
  {
    code: 'HR40',
    name: 'Dvostruki kontrolni broj K1 i K2',
    structure: '(P1)K1K2 - P2 - P3',
    description: 'P1 ima 11 znamenaka uključujući dva kontrolna broja: 10. po modulu 10 i 11. po modulu 11.',
    details: 'Ne smije sadržavati tri identične uzastopne znamenke.',
    controlModule: 'MOD10 + MOD11'
  },
  {
    code: 'HR41',
    name: 'JMBG u P1 + MOD11 u P2',
    structure: '(P1)K - (P2)K - P3',
    description: 'P1 ima 13 znamenaka (JMBG algoritam), P2 se provjerava po MOD11.',
    details: 'Koristi se po posebnom zahtjevu korisnika.',
    controlModule: 'MOD11JMB / MOD11INI'
  },
  {
    code: 'HR42',
    name: 'JMBG algoritam na cijeli niz',
    structure: '(P1 - P2 - P3)K',
    description: 'Cjelokupni poziv na broj provjerava se algoritmom MOD11JMB (utezi 1 do 7).',
    details: 'Jedan zajednički kontrolni broj na kraju niza.',
    controlModule: 'MOD11JMB'
  },
  {
    code: 'HR43',
    name: 'Čekovi tekućih računa',
    structure: 'P1 - (P2)K - P3 - P4',
    description: 'P1 je šifra računa (3 zn.), P2 ček (8 zn. s kontrolnim brojem), P3 (5 zn.), P4 (3 zn.).',
    details: 'P2 se provjerava po MOD11INI.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR50',
    name: 'Privredna banka Zagreb (PBZ)',
    structure: 'P1(K) - P2 - P3',
    description: 'Model rezerviran isključivo za potrebe PBZ-a.',
    details: 'P1 ima 5 znamenaka s MOD11, P2 ima 12 znamenaka, P3 ima 1 znamenku.',
    controlModule: 'MOD11 PBZ'
  },
  {
    code: 'HR55',
    name: 'Plaćanje po specifikaciji / popisu',
    structure: '(P1)K - P2 - P3',
    description: 'Kada se plaća po popisu više računa ili obustava. P1 je broj liste (s kontrolnim brojem).',
    details: 'P1 se provjerava po MOD11INI, a dužnik vjerovniku dostavlja specifikaciju.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR62',
    name: 'Proračunski korisnici (4 podatka)',
    structure: '(P1)K - (P2)K - (P3)K - P4',
    description: 'P1 vrsta prihoda (4 zn.), P2 šifra korisnika proračuna (do 5 zn.), P3 interni ID (do 6 zn.), P4 (do 12 zn.).',
    details: 'P1 i P3 koriste MOD11INI, P2 koristi ISO 7064.',
    controlModule: 'MOD11INI / ISO 7064'
  },
  {
    code: 'HR63',
    name: 'Proračunski korisnici (3 podatka)',
    structure: '(P1)K - (P2)K - (P3)K',
    description: 'P1 vrsta prihoda (4 zn.), P2 korisnik (do 5 zn. s ISO 7064), P3 (do 12 zn. s MOD11INI).',
    details: 'P3 ne smije započeti nulom.',
    controlModule: 'MOD11INI / ISO 7064'
  },
  {
    code: 'HR64',
    name: 'Proračunski korisnici + OIB',
    structure: '(P1)K - (P2)K - P3 ili (P3)K - P4',
    description: 'P1 vrsta prihoda, P2 korisnik, P3 ako je 11 znamenaka tretira se kao OIB (ISO 7064).',
    details: 'P3 do 12 znamenaka, P4 do 9 znamenaka.',
    controlModule: 'MOD11INI / ISO 7064'
  },
  {
    code: 'HR65',
    name: 'Proračunski korisnici i podvrste prihoda',
    structure: '(P1)K - (P2)K - (P3)K - P4',
    description: 'P1 vrsta prihoda (4 zn.), P2 podvrsta prihoda (3 zn.), P3 OIB ili registarski broj.',
    details: 'P1 i P2 koriste MOD11INI, P3 koristi MOD11INI ili ISO 7064.',
    controlModule: 'MOD11INI / ISO 7064'
  },
  {
    code: 'HR67',
    name: 'OIB u P1 (ISO 7064)',
    structure: '(P1)K - P2 - P3',
    description: 'P1 je OIB uplatitelja/primatelja od 11 znamenaka provjeren po ISO 7064 (11, 10).',
    details: 'P2 (do 10 zn.) i P3 (do 8 zn.) su slobodni podaci bez kontrole.',
    controlModule: 'ISO 7064 (11, 10)'
  },
  {
    code: 'HR68',
    name: 'JOPPD i porez na dohodak',
    structure: '(P1)K - (P2)K - P3',
    description: 'P1 šifra prihoda (4 zn.), P2 OIB (11 zn.), P3 oznaka obrasca JOPPD (5 zn.) ili R-Sm (4 zn.).',
    details: 'Standardni obrazac za uplatu doprinosa i poreza vezanih uz JOPPD.',
    controlModule: 'MOD11INI / ISO 7064'
  },
  {
    code: 'HR69',
    name: 'Isplata dohotka / plaće radnika',
    structure: '(P1)K - (P2)K - P3',
    description: 'Isplata plaća i naknada na zaštićene/redovne račune: P1 djelatnost (ili 40002), P2 OIB isplatitelja, P3 šifra primitka (100-plaća, 140-studentski, 260-regres...).',
    details: 'Varijanta I: (P1)K - (P2)K; Varijanta II: 40002 - OIB - šifra primitka (npr. 100 za plaću, 190 prijevoz, 200 dnevnice, 260 regres). Šifra određuje je li primanje izuzeto od ovrhe!',
    controlModule: 'MOD11 / ISO 7064'
  },
  {
    code: 'HR83',
    name: 'FINA naknade po cjeniku',
    structure: '(P1)K - P2 - P3',
    description: 'Isključivo za računovodstvo FINA-e za naplatu naknada prema cjeniku.',
    details: 'P1 šifra naknade (4 zn.), P2 (5, 7 ili 16 zn.), P3 (6 zn.).',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR84',
    name: 'FINA ispravci platnog prometa',
    structure: '(P1)K - P2 - P3',
    description: 'Isključivo za interne ispravke i storniranja FINA naloga.',
    details: 'P1 poslovna jedinica, P2 banka, P3 račun klijenta.',
    controlModule: 'MOD11INI'
  },
  {
    code: 'HR99',
    name: 'Bez poziva na broj (prazno)',
    structure: 'Nema sadržaja',
    description: 'Koristi se kada nalog uopće nema poziv na broj. U tom slučaju obavezni su podaci o platitelju.',
    details: 'U polje se upisuje HR99, a polje poziva na broj ostaje prazno.',
    controlModule: 'Bez sadržaja'
  }
];
