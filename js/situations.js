// Six situations adapted from L. Frank Baum, "The Wonderful Wizard of Oz" (1900),
// which is in the US public domain. Everything here comes from the book, never
// from the 1939 film: the shoes are silver, and Oz is real.
//
// Shape of a situation:
//   scene   what is happening
//   cost    the price the situation puts on choosing at all
//   choices each with its own cost, and a heavier "load" version of that cost
//           that is shown after the choice is made
//
// No choice is marked right. Every choice costs something.

export const SITUATIONS = [
  {
    id: "ditch",
    title: "The ditch and the Kalidahs",
    who: "The Cowardly Lion",
    scene:
      "A deep ditch splits the forest. A fallen tree is the only bridge, and it " +
      "holds one crosser at a time. Behind you, Kalidahs are coming: beasts with " +
      "bodies like bears and heads like tigers.",
    cost: "Someone has to stand at the near edge while the others cross.",
    choices: [
      {
        text: "Stand at the edge and roar while the others cross.",
        cost: "You stay afraid the whole time, and you cross last.",
        load: "The Kalidahs reach the edge before the last friend is over. Standing now means facing them alone.",
        carries: "your safety",
      },
      {
        text: "Cross first and call the others over fast.",
        cost: "The line moves quickest, and the last one over is unguarded.",
        load: "The smallest of the company is last, and slow. Your call is the only thing hurrying them.",
        carries: "your peace of mind",
      },
      {
        text: "Turn the company back along the road.",
        cost: "Nobody faces the Kalidahs today, and the city is days further away.",
        load: "The road back is the way you came, and food is already short.",
        carries: "time",
      },
    ],
  },
  {
    id: "log",
    title: "The log and the plan",
    who: "The Scarecrow",
    scene:
      "The company is across. The Kalidahs start over the tree trunk behind you. " +
      "The Scarecrow sees a way: have the Tin Woodman chop the trunk while the " +
      "beasts are on it. But the Scarecrow believes he has no brains.",
    cost: "If you speak and the plan fails, the failure is yours.",
    choices: [
      {
        text: "Say the plan aloud, though it may be wrong.",
        cost: "If it fails, everyone will know whose idea it was.",
        load: "The Tin Woodman's axe is dull from the road. The plan may be too slow.",
        carries: "your pride",
      },
      {
        text: "Stay quiet and let someone wiser decide.",
        cost: "No blame falls on you, and the moment may pass.",
        load: "Nobody else has a plan. The Kalidahs are halfway across.",
        carries: "your voice",
      },
      {
        text: "Run, and leave the bridge as it is.",
        cost: "You may outrun them, and they keep hunting the company.",
        load: "Dorothy cannot run as fast as you can.",
        carries: "the company's safety",
      },
    ],
  },
  {
    id: "beetle",
    title: "The beetle",
    who: "The Tin Woodman",
    scene:
      "On the road, the Tin Woodman steps on a small beetle and kills it. He " +
      "grieves easily, and his tears rust his jaw shut.",
    cost: "Grief for something small slows the whole company.",
    choices: [
      {
        text: "Grieve the beetle, rust, and accept the delay.",
        cost: "The company stops to oil your jaw over something small.",
        load: "The light is going, and the forest is no place to sleep.",
        carries: "time",
      },
      {
        text: "Hold back the tears and keep walking.",
        cost: "Everyone moves on, and the loss goes unmarked.",
        load: "The road ahead is full of small lives. Holding back gets easier each time.",
        carries: "your tenderness",
      },
      {
        text: "Say nothing, and watch the road more carefully from now on.",
        cost: "No delay, and nobody else ever sees the change.",
        load: "Watching every step makes you the slowest walker in the company.",
        carries: "your ease",
      },
    ],
  },
  {
    id: "poppies",
    title: "The poppy field",
    who: "The whole company",
    scene:
      "A field of scarlet poppies. Their scent puts flesh-and-blood creatures to " +
      "sleep. Dorothy, Toto and the Lion fall. The Scarecrow and the Tin Woodman, " +
      "being straw and tin, stay awake.",
    cost: "The two who are awake can carry Dorothy and Toto. The Lion is too heavy to lift.",
    choices: [
      {
        text: "Carry Dorothy and Toto out, then go back for any way to save the Lion.",
        cost: "You leave the field and walk back into it, with no plan yet.",
        load: "The way back in is longer than the way out, and you do not know what you will find.",
        carries: "certainty",
      },
      {
        text: "Carry Dorothy and Toto out, and accept that the Lion is lost.",
        cost: "The rescue is certain, and the Lion is left behind.",
        load: "The Lion stood at the ditch for all of you.",
        carries: "your loyalty",
      },
      {
        text: "Refuse to leave anyone, and try to drag the Lion now.",
        cost: "Everyone stays in the field longer, including the sleepers.",
        load: "Dorothy's breathing is getting slower.",
        carries: "your safety",
      },
    ],
  },
  {
    id: "cap",
    title: "The Golden Cap",
    who: "Dorothy",
    scene:
      "You hold the Golden Cap. Whoever wears it can command the Winged Monkeys " +
      "three times, and then the power is gone. The Monkeys obey whoever holds " +
      "the Cap, not because they choose to.",
    cost: "Each command spends something that never comes back.",
    choices: [
      {
        text: "Use each command only for what no one can do on foot.",
        cost: "The journey is slower and harder.",
        load: "Your feet are sore, and the Monkeys could carry you in an hour.",
        carries: "your comfort",
      },
      {
        text: "Use the commands freely while they last.",
        cost: "The road is easy now and empty later.",
        load: "The last command is gone, and the hardest part of the road is still ahead.",
        carries: "what comes later",
      },
      {
        text: "Give the Cap away so the Monkeys answer to no one.",
        cost: "You lose the power, and so does anyone who might misuse it.",
        load: "Nobody will carry you over the mountains now.",
        carries: "your power",
      },
    ],
  },
  {
    id: "humbug",
    title: "The humbug",
    who: "The whole company",
    scene:
      "Behind the screen in the throne room, the great Oz is an ordinary man from " +
      "Omaha with no magic at all. He hands the Scarecrow brains of bran, pins and " +
      "needles, the Tin Woodman a silk heart stuffed with sawdust, and the Lion a " +
      "dish he calls courage. The whole Emerald City believes in him.",
    cost: "If you expose him, the city loses what it trusts. If you keep his secret, you share a lie.",
    choices: [
      {
        text: "Keep his secret, and tell only the company what you learned.",
        cost: "The city keeps its peace, resting on something untrue.",
        load: "A citizen asks you, directly, whether the great Oz is real.",
        carries: "your candor",
      },
      {
        text: "Tell the city the truth.",
        cost: "It is honest, and the city's order breaks.",
        load: "The guard at the gate has served Oz all his life. He asks you to take it back.",
        carries: "the city's peace",
      },
      {
        text: "Have him promise to leave, and hand the city to someone fit to rule it.",
        cost: "The truth comes out slowly, and you must trust his word.",
        load: "He agrees, but asks for one more day before he goes.",
        carries: "your trust",
      },
    ],
  },
];
