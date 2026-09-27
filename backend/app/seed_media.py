"""Seed the Media section (Explore menu ▸ Photos / Videos / Brochure / Bharat
Beat / Sanskriti / Events / Latest News / Announcement / Webcast).

Content is drawn verbatim from the Ministry of Culture's official Media pages
(https://culture.gov.in — the canonical source; www.indiaculture.gov.in only
redirects there). Every record keeps its official ``source_url`` for
attribution. Images are local copies under ``frontend/public/images/media/``
so the prototype works offline.

Non-destructive: each table is only filled when empty (same pattern as
:mod:`app.seed_ministry` / :mod:`app.seed_heritage`).

Run from the backend directory::

    python -m app.seed_media
"""
from .database import Base, SessionLocal, engine
from .models import (
    MediaAlbum, MediaArtist, MediaBrochure, MediaEvent, MediaLeader,
    MediaMonument, MediaNews, MediaSanskriti, MediaVideo,
)

IMG = "/images/media"
OFFICIAL = "https://culture.gov.in"


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(MediaNews).count():
            print("Media section already seeded; nothing to do.")
            return

        # ------------------------------------------------------------------ latest news
        news = [
            ("Seven Indian Natural Heritage Sites Added to UNESCO’s Tentative List", "18.09.2025",
             f"{IMG}/news/seven-indian-natural-heritage-sites.png",
             f"{OFFICIAL}/latest-news/seven-indian-natural-heritage-sites-added-unescos-tentative-list"),
            ("Ministry of Culture Launches Sewa Parv 2025", "18.09.2025",
             f"{IMG}/news/moc-launches-sewa-parv-2025.png",
             f"{OFFICIAL}/latest-news/ministry-culture-launches-sewa-parv-2025"),
            ("Ministry of Culture Launches 7th Edition of Prime Minister’s Mementos E-Auction", "16.09.2025",
             f"{IMG}/news/pm-mementos-7th-edition.png",
             f"{OFFICIAL}/latest-news/ministry-culture-launches-7th-edition-prime-ministers-mementos-e-auction"),
            ("Ministry of Culture Leads Multinational Nomination of Chhath Mahaparva to UNESCO’s Intangible Cultural Heritage", "16.09.2025",
             f"{IMG}/news/chhath-mahaparva-unesco-nomination.png",
             f"{OFFICIAL}/latest-news/ministry-culture-leads-multinational-nomination-chhath-mahaparva-unescos-intangible"),
            ("Inauguration of Mann ki Baat Art Exhibition at IGNCA, New Delhi", "15.09.2025",
             f"{IMG}/news/mann-ki-baat-art-exhibition-ignca.png",
             f"{OFFICIAL}/latest-news/inauguration-mann-ki-baat-art-exhibition-ignca-new-delhi"),
            ("“Gyan Bharatam” Initiative Marks a Cultural Renaissance for India’s Manuscript Heritage", "13.09.2025",
             f"{IMG}/news/gyan-bharatam-cultural-renaissance.png",
             f"{OFFICIAL}/latest-news/gyan-bharatam-initiative-marks-cultural-renaissance-indias-manuscript-heritage"),
            ("Prime Minister Addresses Gyan Bharatam International Conference at Vigyan Bhawan", "12.09.2025",
             f"{IMG}/news/pm-addresses-gyan-bharatam-conference.png",
             f"{OFFICIAL}/latest-news/prime-minister-addresses-gyan-bharatam-international-conference-vigyan-bhawan"),
            ("Gyan Bharatam International Conference on India’s Knowledge Legacy Begins in New Delhi", "11.09.2025",
             f"{IMG}/news/gyan-bharatam-conference-begins.png",
             f"{OFFICIAL}/latest-news/gyan-bharatam-international-conference-indias-knowledge-legacy-begins-new-delhi"),
            ("IGNCA Launches ‘Hindi Maah-2025’ with Grand Inauguration", "02.09.2025",
             f"{IMG}/news/ignca-launches-hindi-maah-2025.png",
             f"{OFFICIAL}/latest-news/ignca-launches-hindi-maah-2025-grand-inauguration"),
            ("Screening of Award-Winning Film Selfie Please at IGNCA", "29.08.2025",
             f"{IMG}/news/selfie-please-screening-ignca.png",
             f"{OFFICIAL}/latest-news/screening-award-winning-film-selfie-please-ignca"),
            ("Ujjain to Host PHDCCI’s 2nd Global Spiritual Tourism Conclave", "27.08.2025",
             f"{IMG}/news/phdcci-spiritual-tourism-conclave-ujjain.png",
             f"{OFFICIAL}/latest-news/ujjain-host-phdccis-2nd-global-spiritual-tourism-conclave-rauuhamantic"),
            ("Young Buddhist Scholars Unite at 3rd ICYBS Conference in New Delhi", "22.08.2025",
             f"{IMG}/news/icybs-young-buddhist-scholars.png",
             f"{OFFICIAL}/latest-news/young-buddhist-scholars-unite-3rd-icybs-conference-new-delhi"),
        ]
        for i, (title, date, image, url) in enumerate(news):
            db.add(MediaNews(title=title, date=date, image_url=image, source_url=url, display_order=i))

        # ------------------------------------------------------------------ photo albums
        albums = [
            ("Ministry of Culture and Saksham Sanchar Foundation Mark Vande Mataram@150 with Programme in Madhya Pradesh", "08.09.2026", 8,
             f"{IMG}/photos/vande-mataram-saksham-sanchar-mp.jpeg",
             f"{OFFICIAL}/photo-gallery/ministry-culture-and-saksham-sanchar-foundation-mark-vande-mataram150-programme"),
            ("Ministry of Culture and NEZCC Organise Three-Day Programme in Nagaland to Observe 350th Martyrdom Year of Sri Guru Tegh Bahadur Ji", "07.09.2026", 9,
             f"{IMG}/photos/nezcc-guru-tegh-bahadur-nagaland.jpg",
             f"{OFFICIAL}/photo-gallery/ministry-culture-and-nezcc-organise-three-day-programme-nagaland-observe-350th"),
            ("National Seminar on Legacy of Sri Guru Tegh Bahadur Ji Organised by Sahitya Akademi and PCWA in Navi Mumbai, Maharashtra", "20.08.2026", 8,
             f"{IMG}/photos/sahitya-akademi-guru-tegh-seminor.jpg",
             f"{OFFICIAL}/photo-gallery/national-seminar-legacy-sri-guru-tegh-bahadur-ji-organised-sahitya-akademi-and-pcwa"),
            ("Ministry of Culture Observes Partition Horrors Remembrance Day 2026 Across Delhi, Amritsar and Kolkata", "20.08.2026", 18,
             f"{IMG}/photos/partition-horrors-remembrance-2026.jpeg",
             f"{OFFICIAL}/photo-gallery/ministry-culture-observes-partition-horrors-remembrance-day-2026-across-delhi"),
            ("BRICS Culture Working Group Delegates Witness India’s Rich Cultural Heritage During India’s BRICS Chairship", "10.08.2026", 10,
             f"{IMG}/photos/brics-cultural-heritage-bhopal.jpeg",
             f"{OFFICIAL}/photo-gallery/brics-culture-working-group-delegates-witness-indias-rich-cultural-heritage-during"),
            ("Hon’ble Union Minister of Culture and Tourism Shri Gajendra Singh Shekhawat Chairs Press Conference on Har Ghar Tiranga 2026", "10.08.2026", 4,
             f"{IMG}/photos/har-ghar-tiranga-press-conference.jpeg",
             f"{OFFICIAL}/photo-gallery/honble-union-minister-culture-and-tourism-shri-gajendra-singh-shekhawat-chairs-press"),
            ("3rd BRICS Culture Working Group Meeting Commences in Bhopal Under India’s BRICS Chairship", "10.08.2026", 8,
             f"{IMG}/photos/brics-culture-working-group.jpeg",
             f"{OFFICIAL}/photo-gallery/3rd-brics-culture-working-group-meeting-commences-bhopal-under-indias-brics-chairship"),
            ("SZCC Organises Special Gurmat Kirtan Samagam at Bidar, Karnataka to Observe 350th Martyrdom Year of Sri Guru Tegh Bahadur Ji", "10.08.2026", 6,
             f"{IMG}/photos/szcc-gurmat-kirtan-bidar.jpeg",
             f"{OFFICIAL}/photo-gallery/szcc-organises-special-gurmat-kirtan-samagam-bidar-karnataka-observe-350th-martyrdom"),
            ("South Zone Cultural Centre Holds Special Gurmat Kirtan Samagam in Kerala to Observe 350th Martyrdom Year of Sri Guru Tegh Bahadur Ji", "10.08.2026", 3,
             f"{IMG}/photos/szcc-gurmat-kirtan-kerala.jpg",
             f"{OFFICIAL}/photo-gallery/south-zone-cultural-centre-holds-special-gurmat-kirtan-samagam-kerala-observe-350th"),
            ("NZCC Organises Two-Day Commemorative Programme to Observe 350th Martyrdom Day of Sri Guru Tegh Bahadur Ji", "03.08.2026", 11,
             f"{IMG}/photos/nzcc-guru-tegh-bahadur-two-day.jpeg",
             f"{OFFICIAL}/photo-gallery/nzcc-organises-two-day-commemorative-programme-observe-350th-martyrdom-day-sri-guru"),
            ("Ministry of Culture Strengthens National Digitisation Efforts through Workshop under Gyan Bharatam Initiative", "03.08.2026", 8,
             f"{IMG}/photos/gyan-bharatam-digitisation-workshop.jpg",
             f"{OFFICIAL}/photo-gallery/ministry-culture-strengthens-national-digitisation-efforts-through-workshop-under"),
            ("Ministry of Culture organises National Seminar in Karnataka as part of the year-long Observance of the 350th Martyrdom Day of Sri Guru Tegh Bahadur Ji", "28.07.2026", 5,
             f"{IMG}/photos/national-seminar-guru-tegh-karnataka.jpeg",
             f"{OFFICIAL}/photo-gallery/ministry-culture-organises-national-seminar-karnataka-part-year-long-observance-350th"),
        ]
        for i, (title, date, count, image, url) in enumerate(albums):
            db.add(MediaAlbum(title=title, date=date, items_count=count, cover_image=image, gallery_url=url, display_order=i))

        # ------------------------------------------------------------------ videos
        # ``source_name`` is None for the Ministry's own channel and names the
        # publishing channel for everything else, so the page never attributes
        # a third-party video to the Ministry.
        videos = [
            (None, "वन्दे मातरम् का उद्भव: शब्दों से राष्ट्रचेतना तक", "21.01.2026", "4MINS 17SEC", "Hindi", "1cpQfqMSVww"),
            (None, "वन्दे मातरम्: अमर राष्ट्रगीत का ऐतिहासिक परिचय", "21.01.2026", "4MINS 46SEC", "Hindi", "_sAK-k3ckY8"),
            (None, "स्वतंत्र भारत के निर्माण की आधारशिला: वन्दे मातरम्", "21.01.2026", "5MINS 59SEC", "Hindi", "OxZk3R6BNOA"),
            (None, "स्वतंत्रता संग्राम के विभिन्न आंदोलनों में वन्दे मातरम् की भूमिका", "21.01.2026", "4MINS 08SEC", "Hindi", "zbwZgW4npxc"),
            (None, "स्वाधीनता संग्राम में राष्ट्रचेतना के निर्माण की प्रेरक भूमिका", "21.01.2026", "2MINS 56SEC", "Hindi", "QI4yemaO8mI"),
            (None, "100th birth anniversary of Acharya Shri Vidyanand Ji Maharaj in New Delhi", "28.06.2025", "1H 5MINS", "English", "Pn7Rh02Xt5I"),
            (None, "India the mother of democracy", "26.06.2025", "7MIN", "English", "u86bIEM2-1I"),
            (None, "Samvidhaan Hatya Diwas 2025", "26.06.2025", "3H 13MINS", "English", "Ajbbbe-Yjtk"),
            (None, "Closing Ceremony of World Heritage Committee Meeting 2024", "25.06.2025", "3H 13MINS", "English", "tPp9MSJ-nag"),
            (None, "Culture ministry 10th COP to the UNESCO 2005 Convention on the Diversity of Cultural Expressions", "20.06.2025", "6MINS 19SEC", "English", "uQ2AEgPIYgI"),
            (None, "Commemoration of the 300th Birth Anniversary of Lokmata Ahilyabai Holkar", "20.06.2025", "2H 20Mins", "English", "XXvULyrlo5c"),
            (None, "Ahilyabai Holkar: Guardian of Culture Architect of Governance", "06.05.2025", "3MIN 48SEC", "English", "F5ulPDW8ocY"),
            ("DD India", "PM Modi Launches Prambanan Restoration Project — India’s Mission To Save Hindu Temples Across Asia", "11.07.2026", "6MINS 40SEC", "English", "ExBHOMGthXY"),
            ("DD India", "India’s Cultural Recovery Mission Brings Stolen Heritage Back Home", "16.05.2026", "3MINS 28SEC", "English", "StPcn5fI-PI"),
            ("DD India", "PM Modi’s Cultural Gifts During Five-Nation Tour", "21.05.2026", "8MINS 54SEC", "English", "mxMTUFluK4A"),
            ("MyGov India", "Samrat Samprati Museum Inauguration — Celebrating Jain Wisdom and India’s Timeless Heritage", "31.03.2026", "1MINS 21SEC", "English", "ZaBdsk-MLWg"),
            ("MyGov India", "How PM Modi Revitalized India’s Cultural Landmarks", "18.06.2026", "1MINS 40SEC", "English", "9eRtKmb8WXM"),
            ("Bharatiya Janata Party", "Nalanda: India’s Ancient Wisdom", "28.06.2026", "1MINS 45SEC", "English", "vPpa8OOhKl8"),
            ("Narendra Modi", "The BEAUTY that is Somnath!", "11.05.2026", "16 SECONDS", "English", "uDZ0OxLpmJA"),
            ("India Today", "Old Buildings Will Now Turn Into A Museum", "13.02.2026", "1MINS 21SEC", "English", "jDRS99_yDtE"),
        ]
        for i, (source, title, date, duration, lang, yid) in enumerate(videos):
            db.add(MediaVideo(
                title=title, date=date, duration=duration, language=lang,
                youtube_id=yid, thumbnail_url=f"{IMG}/videos/{yid}.jpg",
                source_name=source, display_order=i,
            ))

        # ------------------------------------------------------------------ brochures
        brochures = [
            ("Bharat: The Mother of Democracy",
             "A tribute to India’s unbroken democratic ethos, tracing its roots from ancient times to the present day — curated by the Indira Gandhi National Centre for the Arts (IGNCA).",
             f"{IMG}/brochure/bharat-the-mother-of-democracy.png",
             f"{OFFICIAL}/files/brochure_document/Bharat_Mother_of_Democracy_English_Brochure.pdf",
             f"{OFFICIAL}/brochure"),
            ("CCRT Brochure",
             "Programmes of the Centre for Cultural Resources and Training (CCRT), the Ministry of Culture’s nodal agency for culture and education.",
             f"{IMG}/brochure/ccrt-brochure.jpg",
             f"{OFFICIAL}/files/brochure_document/CCRT_Brochure_English_Apr_24.pdf",
             f"{OFFICIAL}/brochure"),
            ("NAI Brochure",
             "The National Archives of India (NAI) — India’s repository of official records and keeper of collective memory.",
             f"{IMG}/brochure/nai-brochure.png",
             f"{OFFICIAL}/files/brochure_document/NAI_Brochure.pdf",
             f"{OFFICIAL}/brochure"),
            ("IIH Brochure",
             "The Indian Institute of Heritage (IIH) — education, research and professional training in heritage studies under the Ministry of Culture.",
             f"{IMG}/brochure/iih-brochure.png",
             f"{OFFICIAL}/files/brochure_document/IIH_brochure.pdf",
             f"{OFFICIAL}/brochure"),
        ]
        for i, (title, description, image, pdf, url) in enumerate(brochures):
            db.add(MediaBrochure(title=title, description=description, image_url=image, pdf_url=pdf, source_url=url, display_order=i))

        # ------------------------------------------------------------------ leaders
        leaders = [
            ("Mahatma Gandhi", "mahatma-gandhi",
             "Mahatma Gandhi, born Mohandas Karamchand Gandhi on October 2, 1869, in Porbandar, Gujarat, is one of the most revered leaders in the history of India and a global symbol of non-violent resistance and civil rights. Gandhi's philosophy and methods of non-violence and truth, known as Satyagraha, had a profound influence on movements for civil rights and freedom across the world.\n\nGandhi studied law in London and later worked in South Africa, where he faced racial discrimination and injustice. These experiences were pivotal in shaping his thoughts on equality and resistance to oppression. In South Africa, Gandhi successfully organised the Indian community to resist discriminatory laws through non-violent protests, laying the groundwork for his later efforts in India.\n\nReturning to India in 1915, Gandhi quickly became a prominent leader in the Indian National Congress (INC). He advocated for Swadeshi (self-reliance) by encouraging the use of Indian-made goods and the boycott of British products. One of Gandhi’s most notable acts of protest was the Salt March in 1930. He and his followers walked 240 miles from Sabarmati Ashram to the coastal village of Dandi to produce salt from seawater, defying the British monopoly on salt production and sales. This act of civil disobedience galvanised the Indian population and drew international attention to the Indian independence cause.\n\nDespite his commitment to non-violence, Gandhi’s life was marked by tragedy. On January 30, 1948, he was assassinated by Nathuram Godse, a Hindu nationalist who opposed Gandhi’s tolerance towards Muslims and his efforts to achieve communal harmony.\n\nGandhi is remembered worldwide as a champion of peace, a beacon of moral leadership, and the \"Father of the Nation\" in India. His birthday, October 2nd, is commemorated as Gandhi Jayanti in India and as the International Day of Non-Violence globally.",
             f"{IMG}/bharat-beat/mahatma-gandhi.png",
             f"{OFFICIAL}/mahatma-gandhi"),
            ("Sardar Vallabhbhai Patel", "sardar-vallabhbhai-patel",
             "Sardar Vallabhbhai Patel, often referred to as the \"Iron Man of India,\" was a prominent Indian statesman and a key figure in the country’s struggle for independence. Born on October 31, 1875, in Nadiad, Gujarat, Patel played a crucial role in shaping modern India. Patel initially pursued a career in law, studying in England and qualifying as a barrister. Upon his return to India, he established a successful law practice. However, inspired by Mahatma Gandhi’s leadership and the growing national movement, he gradually became involved in the Indian freedom struggle.\n\nPatel’s organisational skills were first prominently displayed during the Kheda Satyagraha of 1918 and the Bardoli Satyagraha of 1928, where he led successful campaigns against oppressive policies and taxation imposed by the British authorities. These movements not only brought him national recognition but also earned him the title \"Sardar,\" meaning leader or chief. As a senior leader of the Indian National Congress, Patel was instrumental in the party’s activities and strategies. He was a close associate of Gandhi and played a significant role in mobilising support for various non-violent movements, including the Quit India Movement of 1942.\n\nFollowing India’s independence in 1947, Patel became the first Deputy Prime Minister and the first Home Minister of India. His most notable achievement during this period was the integration of over 560 princely states into the Indian Union. Patel also played a crucial role in formulating India’s constitution and establishing a robust administrative framework for the new nation. His efforts in maintaining internal security and promoting national unity were pivotal during the formative years of independent India.\n\nSardar Vallabhbhai Patel passed away on December 15, 1950. His legacy endures through numerous institutions, monuments, and initiatives named in his honour, including the Statue of Unity, the world’s tallest statue, unveiled in 2018 in Gujarat. Patel symbolises strength, unity, and steadfast commitment to the nation.",
             f"{IMG}/bharat-beat/sardar-vallabhbhai-patel.png",
             f"{OFFICIAL}/sardar-vallabhbhai-patel"),
            ("Netaji Subhas Chandra Bose", "netaji-subhas-chandra-bose",
             "Netaji Subhas Chandra Bose was an Indian nationalist leader who played a pivotal role in India's struggle for independence against British rule. Born on January 23, 1897, in Cuttack, Odisha, Bose was a brilliant student, earning a degree from the University of Calcutta and later going to England to prepare for the Indian Civil Services (ICS). However, his passion for India's freedom led him to abandon his ICS aspirations and join the Indian National Congress (INC). Bose quickly rose through the ranks of the INC, becoming known for his radical views and his advocacy for complete independence from British rule, as opposed to the more moderate approach favoured by some leaders. He was elected as the President of the INC in 1938 and 1939 but resigned due to differences with Mahatma Gandhi and other leaders over their non-violent approach.\n\nBose's vision for India’s freedom was to leverage the support of Axis powers during World War II. He escaped from house arrest in India in 1941, travelling through Afghanistan to Germany, where he sought support from Adolf Hitler. In 1943, he went to Japan, where he took command of the Indian National Army (INA), which had been formed by Indian prisoners of war and expatriates.\n\nUnder Bose’s leadership, the INA fought alongside Japanese forces against the British in the northeast of India and Burma. Although the INA was ultimately unsuccessful and disbanded following Japan's defeat, Bose's efforts significantly impacted the Indian independence movement, inspiring many with his bravery and dedication. Bose's mysterious death in a plane crash in Taiwan in August 1945 has been the subject of much speculation and controversy. Despite various investigations, the exact circumstances of his death remain unresolved.\n\nBose is remembered as a hero in India, with numerous institutions, monuments, and awards named in his honour. His legacy endures as a symbol of courage and determination in the fight for India's independence.",
             f"{IMG}/bharat-beat/netaji-subhas-chandra-bose.png",
             f"{OFFICIAL}/netaji-subhas-chandra-bose"),
        ]
        for i, (name, slug, bio, image, url) in enumerate(leaders):
            db.add(MediaLeader(name=name, slug=slug, bio=bio, image_url=image, official_url=url, display_order=i))

        # ------------------------------------------------------------------ 360 monuments
        monuments = [
            ("Taj Mahal", f"{IMG}/monuments/taj-mahal.jpg",
             "https://artsandculture.google.com/streetview/taj-mahal/UwGKcX7FFM5U4g"),
            ("Brihadeshwara Temple", f"{IMG}/monuments/brihadeshwara-temple.png",
             "https://artsandculture.google.com/streetview/brihadeshwara-temple/bQEBFDWGbe1WIQ?sv_lng=79.13209723333006&sv_lat=10.782600687334803&sv_h=-115&sv_p=20&sv_pid=3JuLIKGyCVNnfhbHM9zc5A&sv_z=1"),
            ("Konark Sun Temple", f"{IMG}/monuments/konark-sun-temple.png",
             "https://artsandculture.google.com/streetview/konark-sun-temple/vwGtkelwxcvTdQ?sv_lng=86.0950579843996&sv_lat=19.887413539439486&sv_h=-86&sv_p=14&sv_pid=W76pNPycr8qeIEeAqx8-lA&sv_z=1"),
            ("Kirti Stambh", f"{IMG}/monuments/kirti-stambh.png",
             "https://artsandculture.google.com/streetview/kirti-stambh/tAEUh69_rf4h1A?sv_lng=74.65009018673175&sv_lat=24.892106285441283&sv_h=-104.32502745098225&sv_p=15.660809498403296&sv_pid=GDPOJwrFJhWdearNU-yF0Q&sv_z=1"),
            ("Olakkanesvara Temple Mahabalipuram", f"{IMG}/monuments/olakkanesvara-temple-mahabalipuram.png",
             "https://artsandculture.google.com/streetview/olakkanesvara-temple-mahabalipuram/KAFy9ejWfIz_0w?sv_lng=80.19136200571779&sv_lat=12.615058805746461&sv_h=40.70657107&sv_p=17.51954293&sv_pid=BIbkpwpV-9YCvve1QSinQA&sv_z=1"),
            ("Krishna Temple, Hampi", f"{IMG}/monuments/krishna-temple-hampi.png",
             "https://artsandculture.google.com/streetview/krishna-temple-hampi/0wHDXs-LZqK7Gw?sv_lng=76.46051397446149&sv_lat=15.330134715510331&sv_h=-75.37397727446339&sv_p=10.9709918181957&sv_pid=y5Y84FtfghmXrjFXOjcrwg&sv_z=1.38359336346286"),
            ("Karen Ghar the Ahom Raja's Palace", f"{IMG}/monuments/kareng-ghar-ahom-palace.png",
             "https://artsandculture.google.com/streetview/karen-ghar-the-ahom-raja-s-palace/HQGLzZgYhslEVw?sv_lng=94.74491801627441&sv_lat=26.93613264034211&sv_h=13&sv_p=14&sv_pid=9g9x3Yu3ULwAAAQzVk0kYw&sv_z=1"),
            ("Fatehpur Sikri - Buland Darwaza", f"{IMG}/monuments/fatehpur-sikri-buland-darwaza.png",
             "https://artsandculture.google.com/streetview/fatehpur-sikri-buland-darwaza/BAE-z_40AwGqkQ?sv_lng=77.66269534857298&sv_lat=27.09397016615517&sv_h=20&sv_p=30.00134805588725&sv_pid=TI6Ir35Y0lSvkeynHMHGYQ&sv_z=1"),
            ("Dharmaraja's Ratha, Mahabalipuram", f"{IMG}/monuments/dharmaraja-ratha-mahabalipuram.png",
             "https://artsandculture.google.com/streetview/dharmaraja-s-ratha-mahabalipuram/ZgGuPLf4Xvxrdw?sv_lng=80.18959393433704&sv_lat=12.60866829473535&sv_h=-114.37623229&sv_p=20&sv_pid=iHbjz60hUw12J44AtvPbNw&sv_z=1"),
            ("Church of St. Cajetan", f"{IMG}/monuments/church-of-st-cajetan.png",
             "https://artsandculture.google.com/streetview/church-of-st-cajetan/AAG3PUCGmIevOg?sv_lng=73.9148600217185&sv_lat=15.505520479713681&sv_h=53&sv_p=27&sv_pid=039SibYPGoXaEB0Lqbc1Ig&sv_z=1"),
            ("Basilica of Bom Jesus", f"{IMG}/monuments/basilica-of-bom-jesus.png",
             "https://artsandculture.google.com/streetview/basilica-of-bom-jesus/QgEOTl24FNwqqA?sv_lng=73.91106067642136&sv_lat=15.501277810068354&sv_h=111&sv_p=14&sv_pid=UadQzn72Il-ehypkOUTjfA&sv_z=1"),
            ("Akbar's Tomb", f"{IMG}/monuments/akbars-tomb.png",
             "https://artsandculture.google.com/streetview/akbar-s-tomb/ugGSlfSWl_G04w?sv_lng=77.95032579201522&sv_lat=27.216991262150476&sv_h=-22&sv_p=24&sv_pid=tCXtGWQYqnsmJhCFBHZ3KQ&sv_z=1"),
        ]
        for i, (name, image, sv) in enumerate(monuments):
            db.add(MediaMonument(name=name, image_url=image, streetview_url=sv, display_order=i))

        # ------------------------------------------------------------------ artists
        artists = [
            ("Arupa Gayati Panda", "Dance", f"{IMG}/artists/arupa-gayati-panda.jpg"),
            ("T. Reddi Lakshmi", "Dance", f"{IMG}/artists/t-reddi-lakshmi.jpg"),
            ("Urmika Maibam", "Dance", f"{IMG}/artists/urmika-maibam.jpg"),
            ("Kadam Parikh", "Dance", f"{IMG}/artists/kadam-parikh.jpg"),
            ("Mandakranta Roy", "Dance", f"{IMG}/artists/mandakranta-roy.jpg"),
            ("Nandini Rao Gujar", "Music", f"{IMG}/artists/nandini-rao-gujar.jpg"),
            ("Manoj Rai", "Music", f"{IMG}/artists/manoj-rai.jpg"),
            ("Sahana S.V.", "Music", f"{IMG}/artists/sahana-sv.jpg"),
            ("B. Anantha Krishnan", "Music", f"{IMG}/artists/b-anantha-krishnan.jpg"),
            ("I. Sweta Prasad", "Music", f"{IMG}/artists/i-sweta-prasad.jpg"),
            ("K. Gayatri", "Music", f"{IMG}/artists/k-gayatri.jpg"),
            ("Partho Roy Choudhury", "Music", f"{IMG}/artists/partho-roy-choudhury.jpg"),
        ]
        for i, (name, category, image) in enumerate(artists):
            slug = name.lower().replace(".", "").replace(",", "").replace("  ", " ").replace(" ", "-")
            db.add(MediaArtist(
                name=name, category=category, image_url=image,
                official_url=f"{OFFICIAL}/lalit-kala-akademi/{slug}", display_order=i,
            ))

        # ------------------------------------------------------------------ sanskiti
        sanskriti = [
            ("Bharat: The Mother of Democracy", "bharat-the-mother-of-democracy",
             "A tribute to India’s unbroken democratic ethos, tracing its roots from ancient times to the present day. Curated by IGNCA, it shows how the idea of people’s participation in governance has been intrinsic to Indian civilisation for over 5,000 years — from the Sabhas and Samitis of the Vedas to the self-governing republics of ancient India, told through scriptures, inscriptions, coins and immersive exhibits.",
             f"{IMG}/sanskriti/bharat-the-mother-of-democracy.jpg",
             f"{OFFICIAL}/bharat-mother-democracy-2"),
            ("Unsung Heroes of India’s Freedom Struggle", "unsung-heroes",
             "An attempt to recall and remember the forgotten heroes of India’s freedom struggle — stories of valour, bravery, Satyagraha, dedication and sacrifice from across the subcontinent, told by the Ministry of Culture as part of Azadi Ka Amrit Mahotsav.",
             f"{IMG}/sanskriti/unsung-heroes-freedom-struggle.png",
             f"{OFFICIAL}/unsung-heroes-of-indias-freedom-struggle"),
            ("Digital District Repository", "digital-district-repository",
             "A repository that documents stories of people, events and places linked to the freedom struggle at the micro level of the district — People & Personalities, Events & Happenings, Hidden Treasures (Built & Natural Heritage), and Living Traditions & Art Forms.",
             f"{IMG}/sanskriti/digital-district-repository.jpg",
             f"{OFFICIAL}/digital-district-repository"),
            ("Sansad Ki Kala", "sansad-ki-kala",
             "A celebration of India’s civilisational values, democratic ethos and artistic excellence as reflected in the new Parliament building — guardians, galleries such as Shilp Deergha, Sthapatya Deergha and Sangeet Deergha, signature installations and the Constitutional Gallery, curated by IGNCA.",
             f"{IMG}/sanskriti/sansad-ki-kala.png",
             f"{OFFICIAL}/sanskriti/sansad-ki-kala"),
            ("Sengol", "sengol",
             "The Sengol — an august sceptre steeped in the spiritual and cultural traditions of ancient Tamil civilisation, symbolising the transfer of power from colonial rule to a sovereign Indian state when it was solemnly presented to Pandit Jawaharlal Nehru in 1947. Handcrafted by Vummidi Bangaru Chetty and sanctified by the seers of the Thiruvaduthurai Adheenam.",
             f"{IMG}/sanskriti/sengol.png",
             f"{OFFICIAL}/sanskriti/sengol"),
        ]
        for i, (title, slug, description, image, url) in enumerate(sanskriti):
            db.add(MediaSanskriti(title=title, slug=slug, description=description, image_url=image, official_url=url, display_order=i))

        # ------------------------------------------------------------------ events (Ministry /pasts-events archive)
        events = [
            ("Author Meet & Book Discussion", "Programme", "01.09.2026", "03.09.2026",
             "Conference hall, Central Secretariat Library, Shastri Bhawan, New Delhi", "New Delhi", "Delhi", "18:00 PM",
             f"{IMG}/events/author-meet-book-discussion.jpg",
             f"{OFFICIAL}/events/author-meet-book-discussion"),
            ("NEZCC, under MoC Observes 350th Martyrdom Year of Sri Guru Tegh Bahadur Ji at Gurdwara Sri Guru Singh Sabha, Dimapur, Nagaland",
             "Heritage and Tourism Development", "28.08.2026", "30.08.2026",
             "Gurdwara Sri Guru Singh Sabha, Dimapur, Nagaland", "Dimapur", "Nagaland", "09:00 AM",
             f"{IMG}/events/nezcc-guru-tegh-bahadur-dimapur.jpg",
             f"{OFFICIAL}/events/nezcc-under-moc-observes-350th-martyrdom-year-sri-guru-tegh-bahadur-ji-gurdwara-sri-guru"),
            ("Ministry of Culture Marks Partition Horrors Remembrance Day 2026 Across Delhi, Amritsar and Kolkata, Nation Honours Victims and Survivors",
             "Heritage and Tourism Development", "13.08.2026", "14.08.2026",
             "Nationwide - Multiple Locations", "", "India", "09:00 AM",
             f"{IMG}/events/partition-horrors-remembrance-day.jpeg",
             f"{OFFICIAL}/events/ministry-culture-marks-partition-horrors-remembrance-day-2026-across-delhi-amritsar-and"),
            ("Ministry of Culture and Saksham Sanchar Foundation Mark Vande Mataram@150 with Programme in Ratlam, Madhya Pradesh",
             "Heritage and Tourism Development", "10.08.2026", "10.08.2026",
             "Saraswati Shishu Mandir, Ratlam, Madhya Pradesh", "Ratlam", "Madhya Pradesh", "09:00 AM",
             f"{IMG}/events/vande-mataram-saksham-sanchar-ratlam.jpeg",
             f"{OFFICIAL}/events/ministry-culture-and-saksham-sanchar-foundation-mark-vande-mataram150-programme-ratlam"),
            ("Ministry of Culture’s Har Ghar Tiranga 2026 Movement Kicks Off Nationwide, Celebrating the Spirit of Vande Mataram from 9-17 August",
             "Heritage and Tourism Development", "09.08.2026", "17.08.2026",
             "Nationwide", "", "India", "12:00 PM",
             f"{IMG}/events/har-ghar-tiranga-2026.jpeg",
             f"{OFFICIAL}/events/ministry-cultures-har-ghar-tiranga-2026-movement-kicks-nationwide-celebrating-spirit-vande"),
            ("Sahitya Akademi and PCWA Organise National Seminar on Legacy of Sri Guru Tegh Bahadur Ji in Navi Mumbai, Maharashtra",
             "Heritage and Tourism Development", "08.08.2026", "08.08.2026",
             "Punjab Heritage Bhavan Auditorium, Navi Mumbai, Maharashtra", "Navi Mumbai", "Maharashtra", "09:00 AM",
             f"{IMG}/events/sahitya-akademi-guru-tegh-navimumbai.jpg",
             f"{OFFICIAL}/events/sahitya-akademi-and-pcwa-organise-national-seminar-legacy-sri-guru-tegh-bahadur-ji-navi"),
            ("XI BRICS Culture Ministers’ Meeting Concludes in Bhopal with Adoption of Bhopal Declaration",
             "Heritage and Tourism Development", "08.08.2026", "08.08.2026",
             "Bhopal, Madhya Pradesh", "Bhopal", "Madhya Pradesh", "09:00 AM",
             f"{IMG}/events/xi-brics-culture-ministers-bhopal.jpeg",
             f"{OFFICIAL}/events/xi-brics-culture-ministers-meeting-concludes-bhopal-adoption-bhopal-declaration"),
            ("Sahitya Akademi organises \"Asmita : Reading by Woman Assamese Writers\" and \"Yuva Sahiti : Reading by Young Assamese Writers\"",
             "Programme", "07.08.2026", "07.08.2026",
             "Conference Hall, Guwahati College, Guwahati", "Guwahati", "Assam", "10:00 AM",
             f"{IMG}/events/asmita-yuva-sahiti-assamese.jpg",
             f"{OFFICIAL}/events/sahitya-akademi-organises-asmita-reading-woman-assamese-writers-and-yuva-sahiti-reading"),
            ("Hon’ble Minister of Culture & Tourism, Shri Gajendra Singh Shekhawat Invites Citizens to Join Har Ghar Tiranga 2026, Chairs a Press Conference",
             "Heritage and Tourism Development", "06.08.2026", "06.08.2026",
             "Samvet Auditorium, Indira Gandhi National Centre for the Arts (IGNCA), New Delhi", "New Delhi", "Delhi", "15:00 PM",
             f"{IMG}/events/hgt-press-conference-ignca.jpeg",
             f"{OFFICIAL}/events/honble-minister-culture-tourism-shri-gajendra-singh-shekhawat-invites-citizens-join-har-ghar"),
            ("BRICS Culture Working Group Delegates Explore India’s Cultural Heritage and Strengthen Cultural Cooperation in Bhopal under India’s Chairship",
             "Heritage and Tourism Development", "05.08.2026", "08.08.2026",
             "Bhopal, Madhya Pradesh", "Bhopal", "Madhya Pradesh", "09:00 AM",
             f"{IMG}/events/brics-cwg-delegates-bhopal.jpeg",
             f"{OFFICIAL}/events/brics-culture-working-group-delegates-explore-indias-cultural-heritage-and-strengthen"),
            ("3rd BRICS Culture Working Group Meeting Begins in Bhopal Under India's BRICS Chairship",
             "Heritage and Tourism Development", "05.08.2026", "08.08.2026",
             "Bhopal, Madhya Pradesh", "Bhopal", "Madhya Pradesh", "09:00 AM",
             f"{IMG}/events/3rd-brics-cwg-meeting-bhopal.jpeg",
             f"{OFFICIAL}/events/3rd-brics-culture-working-group-meeting-begins-bhopal-under-indias-brics-chairship"),
            ("Gramalok : Gujarati Poetry Readings", "Programme", "31.07.2026", "31.07.2026",
             "College Auditorium, Khedbrahma, Sabarkantha District, Gujarat", "Khedbrahma", "Gujarat", "09:30 AM",
             f"{IMG}/events/gramalok-gujarati-poetry.jpg",
             f"{OFFICIAL}/events/gramalok-gujarati-poetry-readings"),
        ]
        for i, (title, category, start, end, venue, city, state, time_value, image, url) in enumerate(events):
            db.add(MediaEvent(
                title=title, category=category, start_date=start, end_date=end,
                venue=venue, city=city, state=state, event_time=time_value,
                image_url=image, official_url=url, is_archive=1, display_order=i,
            ))

        db.commit()
        print(
            "Seeded media section: {} news, {} albums, {} videos, {} brochures, "
            "{} leaders, {} monuments, {} artists, {} sanskriti, {} events.".format(
                len(news), len(albums), len(videos), len(brochures),
                len(leaders), len(monuments), len(artists), len(sanskriti), len(events),
            )
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()