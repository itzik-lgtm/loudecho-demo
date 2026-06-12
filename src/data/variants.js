// Real Ramp ad creatives from campaign nN1aFK31rL1RGSsmYuTb
// Source: controlled_ads table — img2, tagline1, category_topics, ai_creative_concept, ai_headline_style
// Vendored locally (public/ramp/creatives/) so the demo runs fully offline.
const BASE = '/ramp/creatives/';

const IMAGES_160 = [
  { file: BASE + '0000_00_Ramp__sports_20260323_104424_1-4_attempt1_logo=True_main_subject_occulted=True_4f85772f_out.jpg',                                                                     tagline: 'Control spend, swim free',                                              topic: 'Sport',                       creativeConcept: 'Cost savings',   headlineStyle: 'Benefit-led'        },
  { file: BASE + '0017_00_Ramp__Celebrity_News__Pop_20260326_094835_1-4_attempt2_logo=True_main_subject_occulted=True_capitalization_error=True_21f0a37a_out.jpg',                               tagline: 'Control spend on autopilot. Enjoy the show.',                           topic: 'Celebrity News & Pop Culture', creativeConcept: 'Cost savings',   headlineStyle: 'Benefit-led'        },
  { file: BASE + '0006_00_Ramp__Automotive_20260326_093413_1-4_attempt2_logo=True_main_subject_occulted=True.jpg',                                                                               tagline: 'Scale without losing control. Cruise without the stress.',              topic: 'Automotive',                  creativeConcept: 'Product-led',    headlineStyle: 'Benefit-led'        },
  { file: BASE + '0007_00_Ramp__Baking_20260326_093526_1-4_attempt2_logo=True_main_subject_occulted=True.jpg',                                                                                  tagline: 'Stop chasing receipts. Rise and grind.',                                topic: 'Baking',                      creativeConcept: 'Cost savings',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0002_00_Ramp__life-style_20260323_105016_1-4_attempt2_logo=True_e9ed6c2f_out.jpg',                                                                                            tagline: 'Control spend on autopilot, enjoy life',                               topic: 'Life Style & Quality',        creativeConcept: 'Cost savings',   headlineStyle: 'Benefit-led'        },
  { file: BASE + '0000_00_Ramp__Recreation_20260326_070137_1-4_attempt1.jpg',                                                                                                                   tagline: 'Slay the receipt monster, play on.',                                   topic: 'Recreation',                  creativeConcept: 'Unknown',        headlineStyle: 'Curiosity-driven'   },
  { file: BASE + '0000_00_Ramp__sports_20260323_092337_1-4_attempt1_logo=True.jpg',                                                                                                             tagline: 'See every dollar instantly, call time-out on chasing receipts.',       topic: 'Sports',                      creativeConcept: 'Cost savings',   headlineStyle: 'Benefit-led'        },
  { file: BASE + '0007_00_Ramp__Baking_20260326_093450_1-4_attempt1_logo=True_main_subject_occulted=True.jpg',                                                                                  tagline: 'Control spend. Not the dough.',                                        topic: 'Baking',                      creativeConcept: 'Cost savings',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0009_00_Ramp__Birdwatching_20260326_093717_1-4_attempt1_logo=True_main_subject_occulted=True.jpg',                                                                            tagline: 'Run finance on autopilot. Enjoy your savings',                         topic: 'Birdwatching',                creativeConcept: 'Cost savings',   headlineStyle: 'Benefit-led'        },
  { file: BASE + '0013_00_Ramp__Business__Economy_20260326_094234_1-4_attempt1_logo=True_main_subject_occulted=True.jpg',                                                                       tagline: 'Control spend before it happens. Run global finance.',                 topic: 'Business & Economy',          creativeConcept: 'Urgency/FOMO',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0007_00_Ramp__Baking_20260326_091714_1-4_attempt1_logo=True.jpg',                                                                                                             tagline: 'Slay the receipt monster, focus on scaling.',                          topic: 'Baking',                      creativeConcept: 'Unknown',        headlineStyle: 'Curiosity-driven'   },
  { file: BASE + '0010_00_Ramp__Blogging__Content_C_20260326_092050_1-4_attempt2.jpg',                                                                                                          tagline: 'Slay the receipt monster, focus on content.',                          topic: 'Blogging & Content',          creativeConcept: 'Unknown',        headlineStyle: 'Curiosity-driven'   },
  { file: BASE + 'Copy_of_0000_00_Ramp__Recreation_20260326_070137_1-4_attempt1.jpg',                                                                                                           tagline: 'Slay the receipt monster, play on.',                                   topic: 'Recreation',                  creativeConcept: 'Urgency/FOMO',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0014_00_Ramp__Law_20260323_162159_1-4_attempt1_cta=True_dc9cd911_out.jpg',                                                                                                    tagline: 'Slay the receipt monster. Settle more claims',                         topic: 'Law',                         creativeConcept: 'Urgency/FOMO',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0013_00_Ramp__Business__Economy_20260326_094308_1-4_attempt2_logo=True_main_subject_occulted=True_d8378f28_out.jpg',                                                          tagline: 'Run finance on autopilot. Grow the economy.',                          topic: 'Business & Economy',          creativeConcept: 'Product-led',    headlineStyle: 'Benefit-led'        },
  { file: BASE + '0001_00_Ramp__Adventure_Sports_20260326_092653_1-4_attempt1_logo=True_main_subject_occulted=True.jpg',                                                                        tagline: 'Run finance on autopilot. Conquer adventure',                          topic: 'Adventure Sports',            creativeConcept: 'Product-led',    headlineStyle: 'Command/Imperative' },
  { file: BASE + 'Copy_of_0010_00_Ramp__Blogging__Content_C_20260326_092050_1-4_attempt2.jpg',                                                                                                  tagline: 'Slay the receipt monster, focus on content.',                          topic: 'Blogging & Content',          creativeConcept: 'Product-led',    headlineStyle: 'Command/Imperative' },
  { file: BASE + '0002_00_Ramp__Archaeology_20260326_092850_1-4_attempt2_logo=True_main_subject_occulted=True.jpg',                                                                             tagline: 'Run finance on autopilot. Unearth more savings.',                      topic: 'Archaeology',                 creativeConcept: 'Cost savings',   headlineStyle: 'Benefit-led'        },
  { file: BASE + 'Copy_of_0001_00_Ramp__Adventure_Sports_20260326_092653_1-4_attempt1_logo=True_main_subject_occulted=True.jpg',                                                                tagline: 'Run finance on autopilot. Conquer adventure.',                         topic: 'Adventure Sports',            creativeConcept: 'Product-led',    headlineStyle: 'Benefit-led'        },
  { file: BASE + 'Copy_of_0002_00_Ramp__Archaeology_20260326_092850_1-4_attempt2_logo=True_main_subject_occulted=True.jpg',                                                                     tagline: 'Run finance on autopilot. Unearth more savings.',                      topic: 'Archaeology',                 creativeConcept: 'Cost savings',   headlineStyle: 'Benefit-led'        },
  { file: BASE + 'Copy_of_0007_00_Ramp__Baking_20260326_091714_1-4_attempt1_logo=True.jpg',                                                                                                     tagline: 'Slay the receipt monster, focus on scaling.',                          topic: 'Baking',                      creativeConcept: 'Unknown',        headlineStyle: 'Curiosity-driven'   },
  { file: BASE + 'Copy_of_0009_00_Ramp__Birdwatching_20260326_093717_1-4_attempt1_logo=True_main_subject_occulted=True.jpg',                                                                    tagline: 'Run finance on autopilot. Spot your savings',                          topic: 'Birdwatching',                creativeConcept: 'Cost savings',   headlineStyle: 'Benefit-led'        },
  { file: BASE + 'Copy_of_0007_00_Ramp__Baking_20260326_093450_1-4_attempt1_logo=True_main_subject_occulted=True.jpg',                                                                          tagline: 'Control spend. Not the dough.',                                        topic: 'Baking',                      creativeConcept: 'Cost savings',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0002_00_Ramp__life-style_20260323_104932_1-4_attempt1_logo=True.jpg',                                                                                                         tagline: 'Control spend before it happens. Find your financial flow',            topic: 'Life Style',                  creativeConcept: 'Urgency/FOMO',   headlineStyle: 'Command/Imperative' },
  { file: BASE + 'Copy_of_0007_00_Ramp__Baking_20260326_093526_1-4_attempt2_logo=True_main_subject_occulted=True.jpg',                                                                          tagline: 'Stop chasing receipts. Rise and grind.',                                topic: 'Baking',                      creativeConcept: 'Cost savings',   headlineStyle: 'Command/Imperative' },
];

const IMAGES_250 = [
  { file: BASE + '0000_00_Ramp__sports_20260325_145445_5-4_attempt2.jpg',                                                                                                                       tagline: 'Slay the receipt monster, focus on winning.',                          topic: 'Sports',                      creativeConcept: 'Urgency/FOMO',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0000_00_Ramp__sports_20260325_145406_5-4_attempt1_logo=True_capitalization_error=True.jpg',                                                                                   tagline: 'Slay the receipt monster, crush your training goals',                  topic: 'Sports',                      creativeConcept: 'Urgency/FOMO',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0010_00_Ramp__Games_20260325_131431_5-4_attempt2_logo=True_main_subject_occulted=True.jpg',                                                                                   tagline: 'Control spend before it happens. Run accounting on autopilot',         topic: 'Games',                       creativeConcept: 'Cost savings',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0010_00_Ramp__Games_20260325_131343_5-4_attempt1_logo=True_main_subject_occulted=True.jpg',                                                                                   tagline: 'Control spend before it happens. Beat the game.',                      topic: 'Games',                       creativeConcept: 'Urgency/FOMO',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0003_00_Ramp__technology_20260325_130402_5-4_attempt1_logo=True_main_subject_occulted=True.jpg',                                                                              tagline: 'Unlock limits that grow with you, no more tech guesswork',             topic: 'Technology',                  creativeConcept: 'Product-led',    headlineStyle: 'Benefit-led'        },
  { file: BASE + '0000_00_Ramp__sports_20260325_130045_5-4_attempt2_logo=True_main_subject_occulted=True.jpg',                                                                                  tagline: 'Control spend before it happens. Play offense, not defense.',          topic: 'Sports',                      creativeConcept: 'Urgency/FOMO',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0019_00_Ramp__Commercial_Real_Esta_20260325_155323_5-4_attempt2.jpg',                                                                                                         tagline: 'Slay the receipt monster, lock down deals.',                           topic: 'Commercial Real Estate',      creativeConcept: 'Cost savings',   headlineStyle: 'Command/Imperative' },
  { file: BASE + 'Copy_of_0010_00_Ramp__Blogging__Content_C_20260325_154453_5-4_attempt1.jpg',                                                                                                  tagline: 'Slay the receipt monster, focus on growing your blog.',                topic: 'Blogging & Content',          creativeConcept: 'Product-led',    headlineStyle: 'Command/Imperative' },
  { file: BASE + 'Copy_of_0007_00_Ramp__Baking_20260325_154156_5-4_attempt1.jpg',                                                                                                              tagline: 'Slay the receipt monster, focus on baking.',                           topic: 'Baking',                      creativeConcept: 'Product-led',    headlineStyle: 'Command/Imperative' },
  { file: BASE + 'Copy_of_0020_00_Ramp__Consumer_Electronics_20260325_155411_5-4_attempt1.jpg',                                                                                                 tagline: 'Slay the receipt monster, focus on building products.',                topic: 'Consumer Electronics',        creativeConcept: 'Product-led',    headlineStyle: 'Command/Imperative' },
  { file: BASE + 'Copy_of_0021_00_Ramp__Cooking__Recipes_20260325_155457_5-4_attempt1_illogical_duplication=True.jpg',                                                                          tagline: 'Slay the receipt monster, perfect your signature dish',                topic: 'Cooking & Recipes',           creativeConcept: 'Product-led',    headlineStyle: 'Curiosity-driven'   },
  { file: BASE + 'Copy_of_0021_00_Ramp__Cooking__Recipes_20260325_155540_5-4_attempt2.jpg',                                                                                                     tagline: 'Slay the receipt monster, focus on crafting recipes.',                 topic: 'Cooking & Recipes',           creativeConcept: 'Product-led',    headlineStyle: 'Command/Imperative' },
  { file: BASE + '0021_00_Ramp__Cooking__Recipes_20260325_155457_5-4_attempt1_illogical_duplication=True.jpg',                                                                                  tagline: 'Slay the receipt monster, serve your signature dish',                  topic: 'Cooking & Recipes',           creativeConcept: 'Unknown',        headlineStyle: 'Curiosity-driven'   },
  { file: BASE + '0000_00_Ramp__sports_20260324_083517_5-4_attempt1_logo=True.jpg',                                                                                                             tagline: 'Sleep well. Focus on winning, not paperwork',                          topic: 'Sports',                      creativeConcept: 'Unknown',        headlineStyle: 'Benefit-led'        },
  { file: BASE + '0007_00_Ramp__stock_market_20260323_155248_5-4_attempt1.jpg',                                                                                                                 tagline: 'Slay the receipt monster, invest in your trade',                       topic: 'Stock Market',                creativeConcept: 'Cost savings',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0001_01_Ramp__finance_20260323_152657_5-4_attempt1.jpg',                                                                                                                      tagline: 'Slay the receipt monster, master your market flow',                    topic: 'Finance',                     creativeConcept: 'Unknown',        headlineStyle: 'Curiosity-driven'   },
  { file: BASE + '0000_00_Ramp__sports_20260323_152300_5-4_attempt1.jpg',                                                                                                                       tagline: 'Slay the receipt monster, focus on the final score',                   topic: 'Sports',                      creativeConcept: 'Cost savings',   headlineStyle: 'Curiosity-driven'   },
  { file: BASE + '0001_00_Ramp__finance_20260323_151618_5-4_attempt1.jpg',                                                                                                                      tagline: 'Slay the receipt monster, unlock visibility',                          topic: 'Finance',                     creativeConcept: 'Unknown',        headlineStyle: 'Curiosity-driven'   },
  { file: BASE + '0004_00_Ramp__investments_20260323_094143_5-4_attempt2_main_subject_occulted=True_97d225fe_out.jpg',                                                                          tagline: 'Control spend before it happens, maximise your returns',               topic: 'Strategic Wealth Mgmt',       creativeConcept: 'Cost savings',   headlineStyle: 'Benefit-led'        },
  { file: BASE + 'pasted_image_7298549b_out_5-4.jpg',                                                                                                                                           tagline: 'Sleep well, control spend before it happens',                          topic: 'Industrial Design',           creativeConcept: 'Cost savings',   headlineStyle: 'Benefit-led'        },
  { file: BASE + '0004_01_Ramp__investments_20260323_110010_5-4_attempt2.jpg',                                                                                                                  tagline: 'Control spend before it happens, play offense not defence',            topic: 'Investments',                 creativeConcept: 'Urgency/FOMO',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0004_00_Ramp__investments_20260323_105916_5-4_attempt1_logo=True_main_subject_occulted=True.jpg',                                                                             tagline: 'Control spend before it happens, play offense, not defence',           topic: 'Investments',                 creativeConcept: 'Urgency/FOMO',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0003_00_Ramp__technology_20260323_105441_5-4_attempt2_logo=True_main_subject_occulted=True.jpg',                                                                              tagline: 'Control spend before it happens, code for efficiency',                 topic: 'Technology',                  creativeConcept: 'Cost savings',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0004_00_Ramp__investments_20260323_094108_5-4_attempt1_logo=True_main_subject_occulted=True.jpg',                                                                             tagline: 'Stop overspending before it starts, scale without losing control',     topic: 'Investments',                 creativeConcept: 'Cost savings',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0003_00_Ramp__technology_20260323_094028_5-4_attempt1_logo=True.jpg',                                                                                                         tagline: 'Control spend before it happens, code the policy',                     topic: 'Technology',                  creativeConcept: 'Cost savings',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0001_00_Ramp__finance_20260323_093108_5-4_attempt2_logo=True_main_subject_occulted=True.jpg',                                                                                 tagline: 'Stop chasing receipts, start mastering complexity',                    topic: 'Finance',                     creativeConcept: 'Unknown',        headlineStyle: 'Curiosity-driven'   },
  { file: BASE + '0000_00_Ramp__sports_20260323_092518_5-4_attempt1_logo=True_logo_duplication=True_main_subject_occulted=True.jpg',                                                            tagline: 'Stop overspending before it starts, play championship finance',        topic: 'Sports',                      creativeConcept: 'Cost savings',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0005_00_Ramp__Cryptocurrency_20260325_150608_5-4_attempt1_22a1b3c4_out.jpg',                                                                                                  tagline: 'Slay the crypto-receipt monster, make crypto seamless.',               topic: 'Cryptocurrency',              creativeConcept: 'Product-led',    headlineStyle: 'Command/Imperative' },
  { file: BASE + '0006_00_Ramp__Business_20260325_150652_5-4_attempt1_ea00659a_out.jpg',                                                                                                        tagline: 'Slay the receipt monster, focus on scaling.',                          topic: 'Business',                    creativeConcept: 'Unknown',        headlineStyle: 'Command/Imperative' },
  { file: BASE + '0008_00_Ramp__innovation_20260325_150822_5-4_attempt1_de88d152_out.jpg',                                                                                                      tagline: 'Slay the receipt monster, unlock innovation.',                         topic: 'Innovation',                  creativeConcept: 'Product-led',    headlineStyle: 'Command/Imperative' },
  { file: BASE + '0010_00_Ramp__Games_20260325_151003_5-4_attempt1_cta=True_6a27b363_out_8f98aa94_out.jpg',                                                                                     tagline: 'Slay the receipt monster, unlock peak performance',                    topic: 'Games',                       creativeConcept: 'Promotional',    headlineStyle: 'Curiosity-driven'   },
  { file: BASE + '0010_00_Ramp__Games_20260325_151055_5-4_attempt2_logo=True_1ec296e6_out.jpg',                                                                                                 tagline: 'Slay the receipt monster, unlock peak dev time',                       topic: 'Games',                       creativeConcept: 'Urgency/FOMO',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0029_00_Ramp__Education_K-12__Hi_20260325_160325_5-4_attempt1.jpg',                                                                                                           tagline: 'Slay the receipt monster. Focus on education.',                        topic: 'Education',                   creativeConcept: 'Explainer',      headlineStyle: 'Curiosity-driven'   },
  { file: BASE + '0028_00_Ramp__Eco-friendly_Living_20260325_160238_5-4_attempt1.jpg',                                                                                                          tagline: 'Slay the receipt monster, focus on sustainability.',                   topic: 'Eco-friendly Living',         creativeConcept: 'Product-led',    headlineStyle: 'Benefit-led'        },
  { file: BASE + '0027_00_Ramp__E-commerce__Online_20260325_160152_5-4_attempt1.jpg',                                                                                                           tagline: 'Slay the receipt monster, launch the next best seller.',               topic: 'E-commerce',                  creativeConcept: 'Product-led',    headlineStyle: 'Command/Imperative' },
  { file: BASE + '0026_00_Ramp__DIY_20260325_160106_5-4_attempt1.jpg',                                                                                                                          tagline: 'Slay the receipt monster, build your business.',                       topic: 'DIY',                         creativeConcept: 'Product-led',    headlineStyle: 'Command/Imperative' },
  { file: BASE + '0024_00_Ramp__Digital_Marketing_St_20260325_155833_5-4_attempt1.jpg',                                                                                                         tagline: 'Slay the receipt monster, focus on growing.',                          topic: 'Digital Marketing',           creativeConcept: 'Cost savings',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0011_00_Ramp__Horoscopes_20260325_151143_5-4_attempt1.jpg',                                                                                                                   tagline: 'Slay the receipt monster, find your focus',                            topic: 'Horoscopes',                  creativeConcept: 'Unknown',        headlineStyle: 'Curiosity-driven'   },
  { file: BASE + '0009_00_Ramp__Accounting_20260325_150920_5-4_attempt1.jpg',                                                                                                                   tagline: 'Slay the receipt monster, focus on accounting.',                       topic: 'Accounting',                  creativeConcept: 'Product-led',    headlineStyle: 'Command/Imperative' },
  { file: BASE + '0007_00_Ramp__stock_market_20260325_150743_5-4_attempt1.jpg',                                                                                                                 tagline: 'Slay the receipt monster, focus on trading.',                          topic: 'Stock Market',                creativeConcept: 'Product-led',    headlineStyle: 'Command/Imperative' },
  { file: BASE + '0001_00_Ramp__finance_20260325_145616_5-4_attempt2.jpg',                                                                                                                      tagline: 'Slay the receipt monster, focus on growing.',                          topic: 'Finance',                     creativeConcept: 'Cost savings',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0021_00_Ramp__Cooking__Recipes_20260325_155540_5-4_attempt2.jpg',                                                                                                             tagline: 'Slay the receipt monster, focus on crafting recipes.',                 topic: 'Cooking & Recipes',           creativeConcept: 'Product-led',    headlineStyle: 'Command/Imperative' },
  { file: BASE + '0007_00_Ramp__Baking_20260325_154156_5-4_attempt1.jpg',                                                                                                                       tagline: 'Slay the receipt monster, focus on baking.',                           topic: 'Baking',                      creativeConcept: 'Product-led',    headlineStyle: 'Command/Imperative' },
  { file: BASE + '0020_00_Ramp__Consumer_Electronics_20260325_155411_5-4_attempt1.jpg',                                                                                                         tagline: 'Slay the receipt monster, focus on building products.',                topic: 'Consumer Electronics',        creativeConcept: 'Product-led',    headlineStyle: 'Command/Imperative' },
  { file: BASE + '0010_00_Ramp__Blogging__Content_C_20260325_154453_5-4_attempt1.jpg',                                                                                                          tagline: 'Slay the receipt monster, focus on growing your blog.',                topic: 'Blogging & Content',          creativeConcept: 'Product-led',    headlineStyle: 'Command/Imperative' },
  { file: BASE + '0014_00_Ramp__Law_20260325_131951_5-4_attempt1_logo=True_main_subject_occulted=True_capitalization_error=True_fea0de19_out_c78763c9_out.jpg',                                 tagline: 'Control spend before it happens. Close books, not the client.',        topic: 'Law',                         creativeConcept: 'Cost savings',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0013_00_Ramp__hobbies_20260325_131910_5-4_attempt2_logo=True_main_subject_occulted=True_7db05031_out_18189fc8_out.jpg',                                                       tagline: 'Control spend before it happens, protect your new pursuit',            topic: 'Hobbies',                     creativeConcept: 'Urgency/FOMO',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0012_00_Ramp__Interviews_20260325_131653_5-4_attempt1_logo=True_main_subject_occulted=True_capitalization_error=True_582eed2d_out_5d86004a_out.jpg',                          tagline: 'One card. Total control. Visibility, simplified.',                     topic: 'Interviews',                  creativeConcept: 'Product-led',    headlineStyle: 'Benefit-led'        },
  { file: BASE + '0009_00_Ramp__Accounting_20260325_131303_5-4_attempt2_logo=True_main_subject_occulted=True_573da06b_out_019adf4d_out.jpg',                                                    tagline: 'One card. Total control. Close the books faster.',                     topic: 'Accounting & Bookkeeping',    creativeConcept: 'Product-led',    headlineStyle: 'Benefit-led'        },
];

const IMAGES_600 = [
  { file: BASE + 'finance_300x600_a4dc29d4_out_9-16_6ef43ed6_out.jpg',                                                                                                                          tagline: 'Control before it happens, grow on your terms',                        topic: 'Investments',                 creativeConcept: 'Urgency/FOMO',   headlineStyle: 'Benefit-led'        },
  { file: BASE + '0002_00_Ramp__life-style_20260323_105258_9-16_attempt2_logo=True_1f167f23_out.jpg',                                                                                           tagline: 'Stop chasing receipts, free up some time',                             topic: 'Life Style',                  creativeConcept: 'Urgency/FOMO',   headlineStyle: 'Command/Imperative' },
  { file: BASE + 'finance_300x600_9-16.jpg',                                                                                                                                                    tagline: 'One card. Total control. Finance up.',                                 topic: 'Investing & Capital',         creativeConcept: 'Product-led',    headlineStyle: 'Benefit-led'        },
  { file: BASE + '0006_00_Ramp__Business_20260323_155154_9-16_attempt1.jpg',                                                                                                                    tagline: 'Slay the receipt monster, unlock global scale',                        topic: 'Business',                    creativeConcept: 'Product-led',    headlineStyle: 'Command/Imperative' },
  { file: BASE + '0014_00_Ramp__Law_20260323_162456_9-16_attempt2.jpg',                                                                                                                         tagline: 'Slay the receipt monster. Overrule the manual expense',                topic: 'Law',                         creativeConcept: 'Cost savings',   headlineStyle: 'Command/Imperative' },
  { file: BASE + '0000_00_Ramp__sports_20260323_080353_9-16_attempt2_logo=True.jpg',                                                                                                            tagline: 'One card, total control. Draft like a champion.',                      topic: 'Sports',                      creativeConcept: 'Product-led',    headlineStyle: 'Benefit-led'        },
  { file: BASE + '0001_00_Ramp__finance_20260323_093438_9-16_attempt2_logo=True_main_subject_occulted=True.jpg',                                                                                tagline: 'One card, total control. Play offense, not defence.',                  topic: 'Finance',                     creativeConcept: 'Product-led',    headlineStyle: 'Benefit-led'        },
];

const IMAGES_728 = [
  { file: BASE + '0014_00_Ramp__Law_20260325_122035_8-1_attempt2_logo=True.jpg',                                                                                                                tagline: 'Sleep well, autopilot your expenses',                                  topic: 'Law',                         creativeConcept: 'Cost savings',   headlineStyle: 'Benefit-led'        },
  { file: BASE + '0009_00_Ramp__Accounting_20260325_121450_8-1_attempt2_logo=True.jpg',                                                                                                         tagline: 'Sleep well, balance the books',                                        topic: 'Accounting',                  creativeConcept: 'Unknown',        headlineStyle: 'Curiosity-driven'   },
  { file: BASE + 'stock_market_8-1.jpg',                                                                                                                                                         tagline: 'Sleep well, while we automate your spend',                             topic: 'Stock Market',                creativeConcept: 'Product-led',    headlineStyle: 'Benefit-led'        },
  { file: BASE + '0001_00_Ramp__finance_20260325_120257_8-1_attempt1_capitalization_error=True_6ce7dab7_out.jpg',                                                                               tagline: 'Sleep well. Autopilot your finance.',                                  topic: 'Finance',                     creativeConcept: 'Product-led',    headlineStyle: 'Benefit-led'        },
];

// Interleave all formats so every format appears within the first visible cards
const _maxLen = Math.max(IMAGES_160.length, IMAGES_250.length, IMAGES_600.length, IMAGES_728.length);
const RAMP_IMAGES = [];
for (let _i = 0; _i < _maxLen; _i++) {
  if (_i < IMAGES_160.length) RAMP_IMAGES.push({ ...IMAGES_160[_i], axis: '160×600' });
  if (_i < IMAGES_250.length) RAMP_IMAGES.push({ ...IMAGES_250[_i], axis: '300×250' });
  if (_i < IMAGES_600.length) RAMP_IMAGES.push({ ...IMAGES_600[_i], axis: '300×600' });
  if (_i < IMAGES_728.length) RAMP_IMAGES.push({ ...IMAGES_728[_i], axis: '728×90'  });
}

// ── Signal badge data pools ────────────────────────────────────────────────
const AUDIENCE_POOL = [
  'Auto Intenders', 'Travel Intenders', 'Homebuyers', 'Tech Buyers',
  'Small Biz Owners', 'Finance Pros', 'Healthcare Buyers', 'Startup Founders',
  'Retail Decision-Makers', 'High-Income HH',
];
const GEO_POOL = [
  'New York, NY', 'San Francisco, CA', 'Austin, TX', 'Chicago, IL',
  'Seattle, WA', 'Miami, FL', 'Boston, MA', 'Los Angeles, CA',
  'Denver, CO', 'Atlanta, GA',
];
const TIME_POOL = [
  'Mon Morning', 'Tue Afternoon', 'Wed Evening', 'Thu Morning',
  'Fri Afternoon', 'Weekend Morning', 'Weekend Evening', 'Business Hours',
  'After Hours', 'Early Morning',
];
const WEATHER_POOL = ['Sunny', 'Rain', 'Snow', 'Cloudy', 'Partly Cloudy', 'Storm'];
const DEVICE_TYPE_POOL = ['Desktop', 'Mobile', 'Tablet', 'CTV'];
const OS_POOL        = ['Windows', 'macOS', 'iOS', 'Android'];
const BROWSER_POOL   = ['Chrome', 'Safari', 'Firefox', 'Edge'];
const PRODUCT_SKU_POOL = [
  'SKU-2847', 'SKU-1093', 'SKU-4521', 'SKU-7734',
  'SKU-3312', 'SKU-8865', 'SKU-5590', 'SKU-2201',
];
const EXTERNAL_DATA_POOL = [
  'NFL Season Start', 'NBA Playoffs', 'Stock Market Rally',
  'Fed Rate Decision', 'Tax Season', 'Product Launch',
  'Major Election', 'Local Festival', 'IPO Filing', 'Industry Conference',
];
export const JOURNEY_STAGES = [
  { index: 0, label: 'Stage 1: Awareness' },
  { index: 1, label: 'Stage 2: Consideration' },
  { index: 2, label: 'Stage 3: Action' },
];

function pick(pool, i, stride = 1, shift = 0) {
  return pool[((i * stride + shift) % pool.length + pool.length) % pool.length];
}

const AXES = ['160×600', '300×250', '300×600', '728×90'];
const AXIS_COLORS = {
  '160×600': { bg: 'bg-purple-100', text: 'text-purple-800' },
  '300×250': { bg: 'bg-teal-100',   text: 'text-teal-800'   },
  '300×600': { bg: 'bg-orange-100', text: 'text-orange-800' },
  '728×90':  { bg: 'bg-blue-100',   text: 'text-blue-800'   },
};

export const REASON_TYPES = {
  'brand-voice':       { label: 'Tagline sentiment ambiguous for brand voice',    metricName: 'confidence',       metricUnit: '%', valueRange: [52, 65], suggestedFix: 'Make tone more optimistic and direct.',                                    isBlocking: false },
  'palette-conflict':  { label: 'Background color may conflict with brand palette', metricName: 'confidence',     metricUnit: '%', valueRange: [50, 60], suggestedFix: 'Replace background with approved secondary palette.',                       isBlocking: false },
  'logo-placement':    { label: 'Flagged: logo too close to edge',                metricName: 'confidence',       metricUnit: '%', valueRange: [55, 68], suggestedFix: 'Reposition logo with minimum 8% margin from edge.',                        isBlocking: false },
  'model-obstruction': { label: 'Model placement partially obstructs tagline',    metricName: 'confidence',       metricUnit: '%', valueRange: [57, 70], suggestedFix: 'Adjust model position to clear tagline area.',                             isBlocking: false },
  'cta-contrast':      { label: 'CTA contrast ratio below threshold',             metricName: 'confidence',       metricUnit: '%', valueRange: [52, 62], suggestedFix: 'Increase CTA background contrast to ≥4.5:1.',                             isBlocking: false },
  'logo-visibility':   { label: 'Logo not visible on this color scheme',          metricName: 'score',            metricUnit: '%', valueRange: [15, 35], suggestedFix: 'Increase contrast or reposition logo.',                                    isBlocking: true  },
  'claim-risk':        { label: 'Claim may require substantiation',               metricName: 'policy-risk',      metricUnit: '',  valueRange: null,     suggestedFix: 'Remove performance claim or attach approved proof point.',                  isBlocking: true  },
  'similarity':        { label: 'Variant too similar to existing creative',       metricName: 'similarity-score', metricUnit: '%', valueRange: [85, 95], suggestedFix: 'Regenerate using a different hook or visual direction.',                    isBlocking: true  },
};

const REVIEW_REASON_KEYS  = ['brand-voice', 'palette-conflict', 'logo-placement', 'model-obstruction', 'cta-contrast'];
const BLOCKED_REASON_KEYS = ['logo-visibility', 'claim-risk', 'similarity'];

const APPROVED_TEXTS = [
  'Passes all brand safety checks — confidence 97%',
  'Strong brand alignment — visual integrity score 94%',
  'Auto-approved — all signals clear, confidence 91%',
];

function buildReason(type, value) {
  const rt = REASON_TYPES[type];
  return { type, label: rt.label, metric: { name: rt.metricName, value, unit: rt.metricUnit }, suggestedFix: rt.suggestedFix, isBlocking: rt.isBlocking };
}

function pickMetricValue(type, rand) {
  const rt = REASON_TYPES[type];
  if (!rt.valueRange) return rand() < 0.7 ? 'High' : 'Medium';
  return Math.round(rt.valueRange[0] + rand() * (rt.valueRange[1] - rt.valueRange[0]));
}

function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function generateVariants(count = 247, offset = 0) {
  const rand = seededRand(42 + offset);
  return Array.from({ length: count }, (_, i) => {
    const imgEntry = RAMP_IMAGES[(i + offset) % RAMP_IMAGES.length];

    const judgeRoll = rand();
    let bucket, reasons, status, judgeText;

    if (judgeRoll < 0.64) {
      bucket = 'recommended';
      reasons = [];
      status = 'approved';
      judgeText = APPROVED_TEXTS[Math.floor(rand() * 3)];
    } else if (judgeRoll < 0.89) {
      bucket = 'needs-review';
      status = 'review';
      const k1 = REVIEW_REASON_KEYS[Math.floor(rand() * REVIEW_REASON_KEYS.length)];
      reasons = [buildReason(k1, pickMetricValue(k1, rand))];
      if (rand() < 0.35) {
        const remaining = REVIEW_REASON_KEYS.filter(k => k !== k1);
        const k2 = remaining[Math.floor(rand() * remaining.length)];
        reasons.push(buildReason(k2, pickMetricValue(k2, rand)));
      }
      judgeText = `${reasons[0].label} — ${reasons[0].metric.name}: ${reasons[0].metric.value}${reasons[0].metric.unit}`;
    } else {
      bucket = 'blocked';
      status = 'rejected';
      const k1 = BLOCKED_REASON_KEYS[Math.floor(rand() * BLOCKED_REASON_KEYS.length)];
      reasons = [buildReason(k1, pickMetricValue(k1, rand))];
      if (rand() < 0.4) {
        const pool = [...BLOCKED_REASON_KEYS, ...REVIEW_REASON_KEYS].filter(k => k !== k1);
        const k2 = pool[Math.floor(rand() * pool.length)];
        reasons.push(buildReason(k2, pickMetricValue(k2, rand)));
      }
      judgeText = `${reasons[0].label} — ${reasons[0].metric.name}: ${reasons[0].metric.value}${reasons[0].metric.unit}`;
    }

    return {
      id: i + 1,
      axis: imgEntry.axis,
      imageUrl: imgEntry.file,
      tagline: imgEntry.tagline,
      topic: imgEntry.topic,
      creativeConcept: imgEntry.creativeConcept,
      headlineStyle: imgEntry.headlineStyle,
      cta: 'Learn more',
      bucket,
      reasons,
      resolutionState: 'pending',
      status,
      judgeText,
      isNew: false,
      signalData: {
        audience:      pick(AUDIENCE_POOL, i, 1, 0),
        geoLocation:   pick(GEO_POOL,      i, 3, 1),
        timeCalendar:  pick(TIME_POOL,     i, 2, 3),
        weather:       pick(WEATHER_POOL,  i, 5, 2),
        device: {
          type:    pick(DEVICE_TYPE_POOL, i, 3, 0),
          os:      pick(OS_POOL,          i, 7, 1),
          browser: pick(BROWSER_POOL,     i, 11, 2),
        },
        productCatalog: pick(PRODUCT_SKU_POOL,    i, 4, 1),
        externalData:   pick(EXTERNAL_DATA_POOL,  i, 6, 2),
        journeyStage:   JOURNEY_STAGES[i % 3],
      },
    };
  });
}

export function generateRefinedVariants(count = 68) {
  const rand = seededRand(99);
  return Array.from({ length: count }, (_, i) => {
    const imgEntry = RAMP_IMAGES[(i + 7) % RAMP_IMAGES.length];

    const judgeRoll = rand();
    let bucket, reasons, status, judgeText;

    if (judgeRoll < 0.75) {
      bucket = 'recommended';
      reasons = [];
      status = 'approved';
      judgeText = APPROVED_TEXTS[Math.floor(rand() * 3)];
    } else if (judgeRoll < 0.92) {
      bucket = 'needs-review';
      status = 'review';
      const k1 = REVIEW_REASON_KEYS[Math.floor(rand() * REVIEW_REASON_KEYS.length)];
      reasons = [buildReason(k1, pickMetricValue(k1, rand))];
      judgeText = `${reasons[0].label} — ${reasons[0].metric.name}: ${reasons[0].metric.value}${reasons[0].metric.unit}`;
    } else {
      bucket = 'blocked';
      status = 'rejected';
      const k1 = BLOCKED_REASON_KEYS[Math.floor(rand() * BLOCKED_REASON_KEYS.length)];
      reasons = [buildReason(k1, pickMetricValue(k1, rand))];
      judgeText = `${reasons[0].label} — ${reasons[0].metric.name}: ${reasons[0].metric.value}${reasons[0].metric.unit}`;
    }

    return {
      id: 1000 + i,
      axis: imgEntry.axis,
      imageUrl: imgEntry.file,
      tagline: imgEntry.tagline,
      topic: imgEntry.topic,
      creativeConcept: imgEntry.creativeConcept,
      headlineStyle: imgEntry.headlineStyle,
      cta: 'Learn more',
      bucket,
      reasons,
      resolutionState: 'pending',
      status,
      judgeText,
      isNew: true,
      signalData: {
        audience:      pick(AUDIENCE_POOL, i, 1, 2),
        geoLocation:   pick(GEO_POOL,      i, 3, 5),
        timeCalendar:  pick(TIME_POOL,     i, 2, 1),
        weather:       pick(WEATHER_POOL,  i, 5, 4),
        device: {
          type:    pick(DEVICE_TYPE_POOL, i, 3, 2),
          os:      pick(OS_POOL,          i, 7, 3),
          browser: pick(BROWSER_POOL,     i, 11, 0),
        },
        productCatalog: pick(PRODUCT_SKU_POOL,    i, 4, 3),
        externalData:   pick(EXTERNAL_DATA_POOL,  i, 6, 5),
        journeyStage:   JOURNEY_STAGES[i % 3],
      },
    };
  });
}

export { AXES, AXIS_COLORS };

export const IMAGE_POOLS = {
  '160×600': IMAGES_160,
  '300×250': IMAGES_250,
  '300×600': IMAGES_600,
  '728×90':  IMAGES_728,
};
