import type { TaskSet } from '../types'

export const QUESTION_BANK: TaskSet[] = [
  // ---------------- READING ----------------
  {
    id: 'cw-1',
    type: 'completeWords',
    title: 'Honeybees',
    paragraph:
      'Honeybees are among the most important pollinators in the world. When they [vis|it] flowers to [coll|ect] nectar, [pol|len] sticks to [th|eir] bodies and is [carr|ied] to other [pla|nts]. [With|out] this process, [ma|ny] crops [wou|ld] produce much [sma|ller] harvests. Unfortunately, bee populations have declined in recent decades.',
  },
  {
    id: 'cw-2',
    type: 'completeWords',
    title: 'Why We Sleep',
    paragraph:
      'Sleep plays a vital role in human health. During sleep, the [bra|in] sorts [infor|mation] from the [prev|ious] day and [sto|res] important memories. [Resea|rchers] have found that [peo|ple] who sleep [le|ss] than six [ho|urs] a night often [stru|ggle] to [conce|ntrate]. For this reason, doctors recommend seven to nine hours of rest.',
  },
  {
    id: 'cw-3',
    type: 'completeWords',
    title: 'Ancient Roads',
    paragraph:
      'The Romans built one of the largest road networks in history. Their [ro|ads] connected distant [pro|vinces] to the [cap|ital] and allowed [arm|ies] to move [qui|ckly]. Many of [th|ese] roads were [bu|ilt] so well that [sec|tions] are still [us|ed] today, nearly two thousand years later.',
  },
  {
    id: 'dl-1',
    type: 'dailyLife',
    title: 'Library Room Reservation',
    text: `From: Westfield University Library <library@westfield.edu>
To: Jordan Lee
Subject: Your study room reservation

Dear Jordan,

Your reservation for Study Room 4B has been confirmed for Thursday, March 12, from 2:00 p.m. to 4:00 p.m. Please note the following:

• Rooms are held for 15 minutes after the start time. If you have not checked in at the front desk by 2:15, your reservation will be released to other students.
• Food is not permitted in study rooms, but drinks in covered containers are allowed.
• Each room has a whiteboard. Markers can be borrowed from the front desk with your student ID.

If you need to cancel, please use the online booking system at least two hours in advance so that others can use the room.

Library Services`,
    questions: [
      {
        q: 'What will happen if Jordan arrives at 2:20 p.m.?',
        options: [
          'Jordan will be charged a late fee.',
          'Jordan may lose the reservation.',
          'Jordan will get a smaller room.',
          'Jordan will need to rebook online.',
        ],
        answer: 1,
        explanation: 'Rooms are held only until 2:15; after that the reservation is released.',
      },
      {
        q: 'Which item is Jordan allowed to bring into the room?',
        options: ['A sandwich', 'A pizza', 'Coffee in a covered cup', 'A personal whiteboard'],
        answer: 2,
        explanation: 'Drinks in covered containers are allowed; food is not.',
      },
      {
        q: 'What is needed to borrow markers?',
        options: ['A student ID', 'A small deposit', 'An online request', 'A librarian’s permission'],
        answer: 0,
      },
    ],
  },
  {
    id: 'dl-2',
    type: 'dailyLife',
    title: 'Campus Café Notice',
    text: `NOTICE: THE BEAN CORNER CAFÉ – NEW HOURS

Starting Monday, October 6, the Bean Corner Café in the Student Center will change its hours:

Monday – Thursday: 7:00 a.m. – 9:00 p.m.
Friday: 7:00 a.m. – 3:00 p.m.
Saturday – Sunday: CLOSED

Why the change? Our weekend visitor numbers have been very low, so we are moving staff to the weekday evening shift, when the café is busiest during exam periods.

Good news: Students who bring a reusable cup will now receive 25 cents off any hot drink. Also, our new "Study Late" menu, which includes soups and sandwiches, will be available after 5:00 p.m. on weekdays.

Questions? Email cafe@studentcenter.edu`,
    questions: [
      {
        q: 'Why is the café changing its hours?',
        options: [
          'It is hiring fewer employees.',
          'Few customers visit on weekends.',
          'The Student Center is being renovated.',
          'Exams have been moved to the weekend.',
        ],
        answer: 1,
      },
      {
        q: 'When can a student order soup from the "Study Late" menu?',
        options: ['Saturday at noon', 'Friday at 4:00 p.m.', 'Tuesday at 6:00 p.m.', 'Monday at 8:00 a.m.'],
        answer: 2,
        explanation: 'The menu is available after 5 p.m. on weekdays, and on Friday the café closes at 3 p.m.',
      },
      {
        q: 'How can students get a discount?',
        options: [
          'By visiting during exam periods',
          'By bringing their own cup',
          'By ordering a sandwich with soup',
          'By showing a student ID',
        ],
        answer: 1,
      },
    ],
  },
  {
    id: 'ar-1',
    type: 'academicReading',
    title: 'The Urban Heat Island Effect',
    text: `Cities are often several degrees warmer than the rural areas that surround them, a phenomenon known as the urban heat island effect. The main cause is the replacement of natural land cover with materials such as asphalt, concrete, and brick. These surfaces absorb large amounts of solar energy during the day and release it slowly at night, which keeps urban temperatures high even after sunset.

A second factor is the lack of vegetation. Trees and plants cool their surroundings through a process called evapotranspiration, in which water evaporates from leaves and removes heat from the air. In densely built areas, there is little room for green space, so this natural cooling is reduced. In addition, tall buildings can trap heat and block wind, while vehicles, air conditioners, and factories release waste heat directly into the environment.

The consequences can be serious. Higher temperatures increase energy demand for cooling, raise levels of air pollution, and put vulnerable people, such as the elderly, at greater risk during heat waves. To address the problem, many cities are experimenting with "cool roofs" painted in light colors that reflect sunlight, as well as green roofs covered with plants. Planting street trees is another popular strategy, since trees provide both shade and evaporative cooling.`,
    questions: [
      {
        q: 'According to the passage, why do cities stay warm at night?',
        options: [
          'Cars are driven more often at night.',
          'Building materials release stored heat slowly.',
          'Winds are stronger in rural areas at night.',
          'Air conditioners are turned off after sunset.',
        ],
        answer: 1,
      },
      {
        q: 'The word "vegetation" in paragraph 2 is closest in meaning to',
        options: ['rainfall', 'plant life', 'open space', 'soil'],
        answer: 1,
      },
      {
        q: 'What is evapotranspiration?',
        options: [
          'The reflection of sunlight by light surfaces',
          'The trapping of heat by tall buildings',
          'The cooling caused by water evaporating from plants',
          'The release of waste heat by factories',
        ],
        answer: 2,
      },
      {
        q: 'Which of the following is NOT mentioned as a consequence of urban heat islands?',
        options: [
          'Greater energy use for cooling',
          'More air pollution',
          'Increased health risks for older people',
          'Higher rates of flooding',
        ],
        answer: 3,
      },
      {
        q: 'Why does the author mention "cool roofs"?',
        options: [
          'To give an example of a solution to the problem',
          'To explain the main cause of the problem',
          'To compare cities with rural areas',
          'To criticize expensive building materials',
        ],
        answer: 0,
      },
    ],
  },
  {
    id: 'ar-2',
    type: 'academicReading',
    title: 'How Coral Reefs Form',
    text: `Coral reefs are some of the most diverse ecosystems on the planet, yet they are built by tiny animals called coral polyps. Each polyp is only a few millimeters wide. It extracts calcium and carbonate from seawater to build a hard skeleton of limestone beneath its soft body. When polyps die, their skeletons remain, and new polyps grow on top of them. Over thousands of years, this slow accumulation produces massive reef structures.

Most reef-building corals depend on a partnership with microscopic algae called zooxanthellae, which live inside the coral's tissues. The algae use sunlight to produce food through photosynthesis and share much of it with the coral. In return, the coral provides the algae with shelter and nutrients. Because the algae need light, reef-building corals generally grow only in clear, shallow water.

This partnership is sensitive to environmental change. When water temperatures rise even slightly above normal for several weeks, corals may expel their algae. Without the algae, the corals lose their color, a process known as bleaching. Bleached corals are not dead, but they are weakened and may die if conditions do not improve. Scientists are therefore concerned that rising ocean temperatures could threaten reefs worldwide.`,
    questions: [
      {
        q: 'How do coral reefs become large structures?',
        options: [
          'Polyps grow to several meters in size.',
          'New polyps build on the skeletons of dead ones.',
          'Algae produce limestone in shallow water.',
          'Waves push sand and rocks together.',
        ],
        answer: 1,
      },
      {
        q: 'What do corals provide to zooxanthellae?',
        options: ['Sunlight', 'Shelter and nutrients', 'Limestone skeletons', 'Food from photosynthesis'],
        answer: 1,
      },
      {
        q: 'Why do reef-building corals usually live in shallow water?',
        options: [
          'Their algae need sunlight.',
          'Deep water is too salty.',
          'Predators live in deeper water.',
          'Shallow water contains more calcium.',
        ],
        answer: 0,
      },
      {
        q: 'The word "expel" in paragraph 3 is closest in meaning to',
        options: ['absorb', 'push out', 'protect', 'change'],
        answer: 1,
      },
      {
        q: 'What can be inferred about bleached corals?',
        options: [
          'They have already died.',
          'They can recover if conditions improve.',
          'They grow faster than healthy corals.',
          'They no longer need algae.',
        ],
        answer: 1,
      },
    ],
  },

  // ---------------- LISTENING ----------------
  {
    id: 'cr-1',
    type: 'chooseResponse',
    title: 'Campus Life Responses',
    items: [
      {
        prompt: 'Do you know when the library closes tonight?',
        speaker: 'female',
        options: ['It opens at eight.', 'I think it’s open until midnight.', 'Yes, I closed it.', 'The books are overdue.'],
        answer: 1,
      },
      {
        prompt: 'Would you mind if I borrowed your notes from yesterday’s lecture?',
        speaker: 'male',
        options: ['Not at all, here you go.', 'Yes, I attended the lecture.', 'I mind the gap.', 'The lecture was long.'],
        answer: 0,
      },
      {
        prompt: 'Why didn’t you come to the study group last night?',
        speaker: 'female',
        options: ['At the library.', 'Around seven o’clock.', 'I had to finish a lab report.', 'We study biology.'],
        answer: 2,
      },
      {
        prompt: 'I can’t believe the exam was moved to Friday.',
        speaker: 'male',
        options: [
          'I know, at least we have more time to review.',
          'Friday comes after Thursday.',
          'I believe in you.',
          'The exam was in room 204.',
        ],
        answer: 0,
      },
      {
        prompt: 'Should we take the bus or walk to the stadium?',
        speaker: 'female',
        options: [
          'The stadium is new.',
          'Let’s walk. It’s such a nice day.',
          'I took the bus yesterday.',
          'Yes, we should.',
        ],
        answer: 1,
      },
      {
        prompt: 'Has Professor Kim posted the grades yet?',
        speaker: 'male',
        options: [
          'She teaches chemistry.',
          'I got the mail.',
          'Not yet, maybe later this afternoon.',
          'The grades are very important.',
        ],
        answer: 2,
      },
      {
        prompt: 'How was your internship interview?',
        speaker: 'female',
        options: [
          'It went better than I expected.',
          'It’s on Main Street.',
          'I will interview next week.',
          'For about three months.',
        ],
        answer: 0,
      },
      {
        prompt: 'The printer on the second floor is out of paper again.',
        speaker: 'male',
        options: [
          'I printed it yesterday.',
          'I’ll let the front desk know.',
          'The second floor is quiet.',
          'Paper is made from trees.',
        ],
        answer: 1,
      },
    ],
  },
  {
    id: 'cr-2',
    type: 'chooseResponse',
    title: 'Everyday Responses',
    items: [
      {
        prompt: 'Are you going to the career fair tomorrow?',
        speaker: 'male',
        options: ['It was fair.', 'I’m planning to stop by after class.', 'I have a career.', 'It was yesterday.'],
        answer: 1,
      },
      {
        prompt: 'Could you help me carry these boxes upstairs?',
        speaker: 'female',
        options: ['Sure, just give me a minute.', 'The boxes are brown.', 'I live upstairs.', 'I helped yesterday.'],
        answer: 0,
      },
      {
        prompt: 'Which dorm are you living in this semester?',
        speaker: 'male',
        options: ['Since September.', 'With two roommates.', 'Hamilton Hall, on the fourth floor.', 'It’s very expensive.'],
        answer: 2,
      },
      {
        prompt: 'I think I left my umbrella in the classroom.',
        speaker: 'female',
        options: [
          'It’s raining outside.',
          'Let’s go back and check before the next class starts.',
          'I don’t have a classroom.',
          'Umbrellas are useful.',
        ],
        answer: 1,
      },
      {
        prompt: 'Didn’t you say you were taking statistics this term?',
        speaker: 'male',
        options: [
          'I was, but I switched to economics.',
          'Statistics is about numbers.',
          'The term ends in May.',
          'I didn’t say anything.',
        ],
        answer: 0,
      },
      {
        prompt: 'What did you think of the guest speaker?',
        speaker: 'female',
        options: [
          'She spoke for an hour.',
          'I was a guest.',
          'Honestly, I found her really inspiring.',
          'In the main auditorium.',
        ],
        answer: 2,
      },
      {
        prompt: 'Is there a place around here where I can get my laptop fixed?',
        speaker: 'male',
        options: [
          'My laptop is new.',
          'There’s a repair shop right next to the bookstore.',
          'Yes, I fixed it.',
          'It’s around five hundred dollars.',
        ],
        answer: 1,
      },
      {
        prompt: 'You look tired. Did you stay up late?',
        speaker: 'female',
        options: [
          'Yeah, I was working on my paper until two.',
          'I look fine.',
          'I stayed at home.',
          'Late is better than never.',
        ],
        answer: 0,
      },
    ],
  },
  {
    id: 'cv-1',
    type: 'conversation',
    title: 'Registering for a Full Class',
    script: [
      { speaker: 'Student', voice: 'male', text: 'Hi, Ms. Alvarez. I wanted to register for Introduction to Psychology, but the system says the class is full.' },
      { speaker: 'Advisor', voice: 'female', text: 'Yes, that course fills up quickly. Have you added yourself to the waiting list?' },
      { speaker: 'Student', voice: 'male', text: 'I did, but I’m number twelve. I need the course this semester because it’s a requirement for my major.' },
      { speaker: 'Advisor', voice: 'female', text: 'I see. Well, there is a second section that meets on Tuesday evenings. It’s taught by a different professor, but it covers the same material and counts toward your major.' },
      { speaker: 'Student', voice: 'male', text: 'Evenings? I work at the campus bookstore on Tuesdays until six.' },
      { speaker: 'Advisor', voice: 'female', text: 'The evening section starts at six thirty, so you should have enough time. And if you still want the morning class, you can stay on the waiting list. Many students drop courses during the first week.' },
      { speaker: 'Student', voice: 'male', text: 'That makes sense. I’ll sign up for the evening section now and keep my place on the list, just in case.' },
    ],
    questions: [
      {
        q: 'Why does the student go to see the advisor?',
        options: [
          'To change his major',
          'To get into a course that is full',
          'To ask about a job at the bookstore',
          'To complain about a professor',
        ],
        answer: 1,
      },
      {
        q: 'What does the advisor say about the evening section?',
        options: [
          'It is not required for his major.',
          'It is taught by the same professor.',
          'It counts toward his major requirements.',
          'It meets on Thursday evenings.',
        ],
        answer: 2,
      },
      {
        q: 'What will the student probably do?',
        options: [
          'Quit his job at the bookstore',
          'Take the course next semester',
          'Register for the evening section and stay on the waiting list',
          'Remove his name from the waiting list',
        ],
        answer: 2,
      },
    ],
  },
  {
    id: 'cv-2',
    type: 'conversation',
    title: 'Finding a Research Source',
    script: [
      { speaker: 'Librarian', voice: 'female', text: 'Hi there. You look a little lost. Can I help you find something?' },
      { speaker: 'Student', voice: 'male', text: 'Yes, please. I’m writing a paper on renewable energy, and my professor said I need at least three peer-reviewed sources. I’ve only found websites so far.' },
      { speaker: 'Librarian', voice: 'female', text: 'That’s a common problem. General websites usually aren’t peer reviewed. You’ll want to use the library’s academic databases instead.' },
      { speaker: 'Student', voice: 'male', text: 'How do I access those? Do I have to be in the library?' },
      { speaker: 'Librarian', voice: 'female', text: 'No, you can log in from anywhere with your student account. On the library homepage, click on Databases, then choose Environmental Science. There’s also a filter that shows only peer-reviewed articles.' },
      { speaker: 'Student', voice: 'male', text: 'Oh, that’s really helpful. What if an article isn’t available in full text?' },
      { speaker: 'Librarian', voice: 'female', text: 'Then you can request it through interlibrary loan. It usually takes about three days, so I’d start searching soon.' },
    ],
    questions: [
      {
        q: 'What is the student’s problem?',
        options: [
          'He cannot log in to his student account.',
          'He has not found appropriate academic sources.',
          'He does not understand the paper topic.',
          'He lost a library book.',
        ],
        answer: 1,
      },
      {
        q: 'According to the librarian, how can the student access the databases?',
        options: [
          'Only from computers inside the library',
          'By paying a small fee',
          'From anywhere using his student account',
          'By asking his professor for a password',
        ],
        answer: 2,
      },
      {
        q: 'Why does the librarian suggest starting the search soon?',
        options: [
          'The databases will close next week.',
          'Interlibrary loan requests take several days.',
          'The paper is due tomorrow.',
          'The library is busy in the evenings.',
        ],
        answer: 1,
      },
    ],
  },
  {
    id: 'an-1',
    type: 'announcement',
    title: 'Field Trip Update',
    script: [
      {
        speaker: 'Professor',
        voice: 'male',
        text: 'Before we begin today, I have an update about Saturday’s geology field trip. Because of the heavy rain forecast, we’re moving the trip from Saturday to Sunday. The bus will still leave from the parking lot behind the science building, but the departure time is now eight thirty instead of eight. Please wear boots, since the trail near the river may still be muddy. Lunch will be provided, but bring your own water bottle. And remember, the field report based on this trip is due one week later, so take detailed notes and photos of the rock layers we visit.',
      },
    ],
    questions: [
      {
        q: 'Why has the field trip been changed?',
        options: ['The bus is not available.', 'Bad weather is expected.', 'The trail is closed.', 'The professor is busy.'],
        answer: 1,
      },
      {
        q: 'What time will the bus leave?',
        options: ['8:00', '8:30', '9:00', '9:30'],
        answer: 1,
      },
      {
        q: 'What are students asked to bring?',
        options: ['Lunch', 'A camera tripod', 'A water bottle', 'Rock samples'],
        answer: 2,
      },
    ],
  },
  {
    id: 'an-2',
    type: 'announcement',
    title: 'New Recycling Program',
    script: [
      {
        speaker: 'Announcer',
        voice: 'female',
        text: 'Attention, residents of North Campus housing. Starting next Monday, we are launching a new composting program. Green bins will be placed in every kitchen area. Please use them for food scraps, coffee grounds, and paper napkins only. Plastic, including so-called biodegradable plastic, should still go in the regular recycling bins. The compost will be used in the campus community garden. To celebrate the launch, the Sustainability Office will hold an information session this Wednesday at five p.m. in the North Lounge. Everyone who attends will receive a free reusable shopping bag.',
      },
    ],
    questions: [
      {
        q: 'What is the main purpose of the announcement?',
        options: [
          'To introduce a composting program',
          'To announce the closing of a garden',
          'To recruit volunteers for the kitchen',
          'To explain a new housing fee',
        ],
        answer: 0,
      },
      {
        q: 'What should NOT be put in the green bins?',
        options: ['Coffee grounds', 'Food scraps', 'Paper napkins', 'Biodegradable plastic'],
        answer: 3,
      },
      {
        q: 'What will people who attend the information session receive?',
        options: ['A green bin', 'A reusable bag', 'Free vegetables', 'A coffee voucher'],
        answer: 1,
      },
    ],
  },
  {
    id: 'at-1',
    type: 'academicTalk',
    title: 'How Birds Navigate',
    script: [
      {
        speaker: 'Professor',
        voice: 'female',
        text: 'Today we’re looking at one of the great puzzles in biology: how migratory birds find their way over thousands of kilometers. It turns out birds don’t rely on just one method. First, many species use the sun as a compass. They can adjust for the sun’s movement across the sky using an internal clock. But what about birds that migrate at night? Experiments in planetariums showed that some night migrants learn the pattern of stars around the North Star, which stays in roughly the same place. There’s also strong evidence that birds can sense the Earth’s magnetic field. When researchers placed small magnets on pigeons on cloudy days, the pigeons had trouble finding their way home. On sunny days, though, the magnets made little difference. What does that tell us? That birds use several systems, and they switch between them depending on conditions.',
      },
    ],
    questions: [
      {
        q: 'What is the talk mainly about?',
        options: [
          'Why birds migrate in winter',
          'The different methods birds use to navigate',
          'How planetariums are used in education',
          'The effects of magnets on human health',
        ],
        answer: 1,
      },
      {
        q: 'Why does the professor mention the North Star?',
        options: [
          'To explain how some birds navigate at night',
          'To show that birds prefer cloudy nights',
          'To describe how pigeons find food',
          'To compare stars with the sun',
        ],
        answer: 0,
      },
      {
        q: 'What did the pigeon experiment suggest?',
        options: [
          'Pigeons cannot sense magnetic fields.',
          'Pigeons rely only on the sun.',
          'Pigeons use magnetic information when the sun is not visible.',
          'Magnets help pigeons fly faster.',
        ],
        answer: 2,
      },
      {
        q: 'What can be concluded from the talk?',
        options: [
          'Birds use a combination of navigation systems.',
          'Night migration is uncommon.',
          'Birds always follow the same route.',
          'Scientists have completely solved the puzzle.',
        ],
        answer: 0,
      },
    ],
  },
  {
    id: 'at-2',
    type: 'academicTalk',
    title: 'The Origins of Paper Money',
    script: [
      {
        speaker: 'Professor',
        voice: 'male',
        text: 'Let’s talk about where paper money came from. Most historians trace it to China during the Tang and Song dynasties. At first, merchants carried heavy strings of metal coins, which was inconvenient and risky for long trips. So they began leaving their coins with trusted shops and receiving paper receipts in return. These receipts could then be traded, almost like money. By the eleventh century, the Song government saw the advantages and started issuing official paper notes. However, there was a problem. Because paper was cheap to produce, the government was tempted to print too much, especially during wars. And when too many notes were printed, their value fell, which is what we now call inflation. So, from the very beginning, paper money showed both its great convenience and its biggest risk.',
      },
    ],
    questions: [
      {
        q: 'Why did merchants start using paper receipts?',
        options: [
          'Metal coins were heavy and risky to carry.',
          'The government banned metal coins.',
          'Paper was more valuable than metal.',
          'Shops refused to accept coins.',
        ],
        answer: 0,
      },
      {
        q: 'According to the professor, what caused paper notes to lose value?',
        options: [
          'Merchants stopped trading them.',
          'The government printed too many of them.',
          'Foreign coins became popular.',
          'Paper became expensive.',
        ],
        answer: 1,
      },
      {
        q: 'What is the professor’s main point at the end of the talk?',
        options: [
          'Paper money was a failure in China.',
          'Paper money has advantages and a major risk.',
          'Wars were caused by inflation.',
          'Coins are better than paper money.',
        ],
        answer: 1,
      },
    ],
  },

  // ---------------- WRITING ----------------
  {
    id: 'bs-1',
    type: 'buildSentence',
    title: 'Campus Conversations',
    items: [
      { context: 'Did you finish the chemistry assignment?', chunks: ['I', 'still need', 'to complete', 'the last', 'two questions'] },
      { context: 'Where should we meet for the project?', chunks: ['How about', 'the café', 'next to', 'the main', 'library'] },
      { context: 'Why was the lecture canceled?', chunks: ['The professor', 'was', 'attending', 'a conference', 'in Chicago'] },
      { context: 'What did you think of the new dorm?', chunks: ['The rooms', 'are', 'much bigger', 'than I', 'expected'] },
      { context: 'Can you tell me when the paper is due?', chunks: ['It', 'has to be', 'submitted', 'by Friday', 'at noon'] },
      { context: 'Have you decided on your major yet?', chunks: ['I am', 'thinking about', 'studying', 'environmental', 'science'] },
    ],
  },
  {
    id: 'bs-2',
    type: 'buildSentence',
    title: 'Everyday Situations',
    items: [
      { context: 'Is the gym open this weekend?', chunks: ['It', 'will be', 'closed', 'for repairs', 'on Saturday'] },
      { context: 'Why are you taking the bus today?', chunks: ['My bike', 'got', 'a flat tire', 'this', 'morning'] },
      { context: 'Do you know who won the debate?', chunks: ['I heard', 'that', 'the team', 'from Boston', 'won'] },
      { context: 'Could you recommend a good book?', chunks: ['You should', 'read', 'the novel', 'I told you', 'about'] },
      { context: 'How was the job interview?', chunks: ['They', 'asked me', 'to come back', 'for a second', 'interview'] },
      { context: 'What time does the concert start?', chunks: ['The doors', 'open', 'at seven', 'but the show', 'starts at eight'] },
    ],
  },
  {
    id: 'em-1',
    type: 'email',
    title: 'Missed Class',
    to: 'Professor Martinez',
    scenario:
      'You missed an important class last week because you were sick. The professor mentioned in the course announcement that a quiz will be given based on that class. Write an email to your professor.',
    bullets: [
      'Explain why you missed the class.',
      'Ask how you can get the material you missed.',
      'Ask about the upcoming quiz.',
    ],
  },
  {
    id: 'em-2',
    type: 'email',
    title: 'Broken Heater',
    to: 'Mr. Thompson, Apartment Manager',
    scenario:
      'The heater in your apartment stopped working three days ago, and the weather has become very cold. You called the office once but nobody came. Write an email to your apartment manager.',
    bullets: [
      'Describe the problem and how it is affecting you.',
      'Mention what you have already done.',
      'Request a specific solution and time.',
    ],
  },
  {
    id: 'ds-1',
    type: 'discussion',
    title: 'Courses Outside Your Major',
    professor:
      'This week we are discussing the structure of university education. Many universities require students to take courses in subjects outside their major, such as a science student taking art history.',
    question:
      'Do you think universities should require students to take courses outside their major, or should students focus only on their own field? Why?',
    students: [
      {
        name: 'Claire',
        text: 'I think these requirements are valuable. Taking a philosophy class helped me think more critically, and that skill is useful in my engineering courses too. Employers also want people who can see problems from different perspectives.',
      },
      {
        name: 'Andrew',
        text: 'I understand the idea, but university is expensive. Students should be able to spend their limited time and money on courses that prepare them directly for their careers. Extra requirements can also delay graduation.',
      },
    ],
  },
  {
    id: 'ds-2',
    type: 'discussion',
    title: 'Public Transport vs. Roads',
    professor:
      'In our urban planning unit, we have been looking at how cities spend their transportation budgets. City governments often have to choose between improving public transportation and building or expanding roads.',
    question:
      'If a city has a limited budget, should it invest more in public transportation or in roads for cars? Explain your opinion.',
    students: [
      {
        name: 'Maya',
        text: 'Public transportation should be the priority. Buses and trains move many more people using less space, and they reduce pollution. Building more roads usually just leads to more traffic in the long run.',
      },
      {
        name: 'Daniel',
        text: 'In many cities, especially spread-out ones, people depend on cars. Roads are also used by buses, delivery trucks, and emergency vehicles, so improving roads benefits everyone, not only drivers.',
      },
    ],
  },

  // ---------------- SPEAKING ----------------
  {
    id: 'lr-1',
    type: 'listenRepeat',
    title: 'Science Museum Tour Guide',
    context:
      'You are a new tour guide at a science museum. Your manager is teaching you what to say to visitors. Listen to each sentence and repeat it exactly.',
    sentences: [
      'Welcome to the museum.',
      'Please stay with the group.',
      'The dinosaur exhibit is on the second floor.',
      'Photos are allowed, but please turn off the flash.',
      'This skeleton is more than sixty million years old.',
      'If you have any questions, feel free to ask me at any time.',
      'At the end of the tour, you can visit the gift shop located next to the main entrance.',
    ],
  },
  {
    id: 'lr-2',
    type: 'listenRepeat',
    title: 'Library Orientation',
    context:
      'You are working at the university library information desk. A senior staff member is showing you how to help new students. Listen and repeat each sentence.',
    sentences: [
      'Good morning, how can I help?',
      'You need your student card to borrow books.',
      'The quiet study area is on the third floor.',
      'Laptops can be borrowed for up to four hours.',
      'Please return all books before the end of the semester.',
      'Group study rooms can be reserved online up to one week in advance.',
      'If a book is not on the shelf, you can request it from another campus library.',
    ],
  },
  {
    id: 'lr-3',
    type: 'listenRepeat',
    title: 'Restaurant Training',
    context:
      'You have just started working as a server at a restaurant. The manager is explaining what to say to customers. Listen and repeat.',
    sentences: [
      'Your table is ready.',
      'Can I get you something to drink?',
      'Today’s special is grilled salmon with rice.',
      'All of our desserts are made fresh every morning.',
      'Please let me know if you have any food allergies.',
      'We offer a ten percent discount to students on weekdays.',
      'If you would like to reserve a table for a large group, please call us a day ahead.',
    ],
  },
  {
    id: 'iv-1',
    type: 'interview',
    title: 'Technology and Learning',
    intro:
      'You have agreed to take part in a research study about how students use technology for learning. The researcher will ask you some questions.',
    questions: [
      'Thank you for joining us. To start, could you tell me how you usually use technology when you study?',
      'Some people prefer reading on paper, while others prefer reading on screens. Which do you prefer, and why?',
      'Many schools now allow students to use AI tools for homework. Do you think this is a good idea? Why or why not?',
      'Finally, imagine you could design a new app to help students learn. What would it do, and how would it help them?',
    ],
  },
  {
    id: 'iv-2',
    type: 'interview',
    title: 'Community and Volunteering',
    intro:
      'You are being interviewed by a city council member who is collecting opinions about community life. Answer the questions.',
    questions: [
      'Thanks for talking with me today. Could you describe the neighborhood where you live?',
      'Have you ever done any volunteer work? If not, what kind of volunteer work would interest you?',
      'Some people think companies should give employees paid time off to volunteer. What is your opinion?',
      'If the city had money for one new public space, such as a park, a library, or a sports center, which would you choose and why?',
    ],
  },
]
