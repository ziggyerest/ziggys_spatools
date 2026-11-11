// NOTAMS: notices for Flight Deck. Each one shows only when a matching aircraft is selected.
// To ADD one: copy a block, change the text, and list the aircraft under "aircraft".
// Aircraft codes: A220, A318, A319, A320, A321, A330, A350, 737, 777, 787.
const NOTAMS = [
  {
    "title": "Aeroware NOTAM",
    "issuer": "Flight Deck Leadership",
    "effective": "5/5/26",
    "severity": "Medium",
    "aircraft": [
      "A220",
      "A318",
      "A319",
      "A321",
      "A350"
    ],
    "issue": "There is a visual glitch where passengers are unable to see the Captain, making it look unrealistic.",
    "actions": [
      "To ensure realism, Flight Deck Leadership requires the Captain to press backspace and to re-enter the aircraft."
    ],
    "important": [
      "Aircraft must be at a complete stop and anchored."
    ]
  },
  {
    "title": "Airbus A350 NOTAM",
    "issuer": "Flight Deck Leadership",
    "effective": "7/5/26",
    "severity": "Medium",
    "aircraft": [
      "A350"
    ],
    "issue": "The A350 is known for being slow and in most scenarios will overrun the runway.",
    "actions": [
      "If the Flight Deck determines there is not enough runway room to take off, you must anchor the aircraft and wait until the plane is above stall speed, then proceed to pull up."
    ],
    "important": []
  },
  {
    "title": "Boeing 787 NOTAM",
    "issuer": "Flight Deck Leadership",
    "effective": "5/4/26",
    "severity": "Low",
    "aircraft": [
      "787"
    ],
    "issue": "The B787 has an extremely high maximum speed, and the turning mechanics are highly realistic; therefore, it is highly recommended to begin banking into turns early.",
    "actions": [
      "Flight Deck members may not exceed 66% throttle (300 knots) when operating the aircraft. If the airspeed indicator glitches, note that stall speed is approximately 30% throttle (137 knots)."
    ],
    "important": []
  },
  {
    "title": "Airbus A318/A321 NOTAM",
    "issuer": "Flight Deck Leadership",
    "effective": "05/05/26",
    "severity": "Low",
    "aircraft": [
      "A318",
      "A321"
    ],
    "issue": "A known issue may cause the Captain's flight controls to experience significant input delay. This can result in sluggish aircraft handling and noticeable lag during the flight.",
    "actions": [
      "If this issue occurs, transfer aircraft control to the First Officer, then immediately transfer it back to the Captain."
    ],
    "important": [
      "Do NOT perform this procedure during critical phases of flight (taxi, takeoff, approach, or landing).",
      "This procedure may only be carried out while the aircraft is on the ground or when the aircraft is in cruise.",
      "If no First Officer is available, continue operating the aircraft with caution and notify Flight Deck Leadership if the issue affects the flight."
    ]
  },
  {
    "title": "A321neo Engine Start",
    "issuer": "",
    "effective": "",
    "severity": "",
    "aircraft": [
      "A321"
    ],
    "issue": "",
    "actions": [
      "On the A321neo, you must switch to Camera 4 to turn on the engines."
    ],
    "important": []
  },
  {
    "title": "Vuela NOTAM",
    "issuer": "Flight Deck Leadership",
    "effective": "7/12/26",
    "severity": "High",
    "aircraft": [
      "A320",
      "A330",
      "777",
      "787"
    ],
    "issue": "Vuela is known for flinging, movement related-glitches, and performance issues.",
    "actions": [
      "Flight Deck is required to check the NOTAMs for Airbus A330 and Boeing 777."
    ],
    "important": []
  },
  {
    "title": "Airbus A330 NOTAM",
    "issuer": "Flight Deck leadership",
    "effective": "7/12/26",
    "severity": "High",
    "aircraft": [
      "A330"
    ],
    "issue": "Following the return of the Vuela A330 to service, both aircrafts are known to experience instability, including flinging, movement related-glitches, and general performance issues.",
    "actions": [
      "All Flight Deck members operating Vuela aircrafts must follow the procedures below:",
      "Do not unanchor while seated. Always exit and re-enter the seat.",
      "Keep your camera level with the horizon and avoid excessive camera movement.",
      "Avoid taxiing directly on taxiway centerlines, as the aircraft is highly sensitive and may cause flings.",
      "During cruise, land on the cruise pad, come to a complete stop, and then anchor.",
      "Never anchor the aircraft while it is moving, as it will cause severe glitches and break the aircraft."
    ],
    "important": []
  },
  {
    "title": "Boeing 777 NOTAM",
    "issuer": "Flight Deck leadership",
    "effective": "7/21/26",
    "severity": "High",
    "aircraft": [
      "777"
    ],
    "issue": "Following the return of the Vuela B777 to service, both aircrafts are known to experience instability, including flinging, movement related-glitches, and general performance issues.",
    "actions": [
      "All Flight Deck members operating Vuela aircrafts must follow the procedures below:",
      "Do not unanchor while seated. Always exit and re-enter the seat.",
      "Keep your camera level with the horizon and avoid excessive camera movement.",
      "Avoid taxiing directly on taxiway centerlines, as the aircraft is highly sensitive and may cause flings.",
      "Do not land on the cruise pad or enable Cruise Mode. Instead, inform the Host and Cabin Crew that service should be done from their seats. Flight Deck should descent at stall speed or fly holding circles around the airport.",
      "Never anchor the aircraft while it is moving, as it will cause severe glitches and break the aircraft."
    ],
    "important": []
  }
];
