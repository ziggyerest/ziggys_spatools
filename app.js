
// group the sidebar links by department (each page is assigned to one group)
document.addEventListener('DOMContentLoaded', function () {
  var nav = document.querySelector('.main-nav');
  if (!nav) return;
  var groups = [
    ['Flight',       ['flight', 'routeinfo', 'charts', 'fleet']],
    ['Cabin Crew',   ['cc', 'pf', 'roles', 'greet']],
    ['Managers',     ['cohost', 'briefing']],
    ['Ground Crew',  ['gc', 'atc']],
    ['Security',     ['ss']],
    ['Tools',        ['suggest', 'permissions']]
  ];
  var byPage = {};
  nav.querySelectorAll('button').forEach(function (b) {
    var m = (b.getAttribute('onclick') || '').match(/showPage\('(\w+)'/);
    if (m) byPage[m[1]] = b;
  });
  nav.querySelectorAll('.nav-group').forEach(function (h) { h.remove(); });
  groups.forEach(function (grp) {
    var header = document.createElement('div');
    header.className = 'nav-group';
    header.textContent = grp[0];
    nav.appendChild(header);
    grp[1].forEach(function (id) { if (byPage[id]) nav.appendChild(byPage[id]); });
  });
});


// ═══════════════════════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════════════════════

const CHART_MAP = {
  "Punta Cana":"Punta Cana","Mark Neris":"Mark Neris",
  "London Heathrow":"London Heathrow","Southwest Regional":"Southwest Regional",
  "Summit Peak":"Summit Peak","Jackson Hole":"Jackson Hole",
  "Monbetsu":"Monbetsu","Mesa Regional":"Mesa Regional"
};

// ═══════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════
let curRoute = null;
let wxData = null;
let clState = {};

// ═══════════════════════════════════════════════════════════════
//  ROUTE LOOKUP
// ═══════════════════════════════════════════════════════════════
function lookupRoute(num) {
  if (!num) return null;
  const id = 'SPA' + num;
  const matches = [];
  for (const [ap, data] of Object.entries(ROUTES)) {
    if (data.routes[id]) matches.push({ id, airport: ap, icao: data.icao, ...data.routes[id] });
  }
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  // Multiple airports share this ID — return all as multi
  return { id, multi: matches };
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
const g = id => document.getElementById(id);
const name = () => g('inp-name').value.trim() || 'your Captain';
const rid = () => 'SPA' + (g('inp-rid').value.trim() || '????');
const ac = () => g('inp-ac').value;
const gate = () => g('inp-gate').value.trim() || 'Gate 2';
const destCity = () => curRoute ? curRoute.dest.replace(/\s*\[.*\]/, '') : '[DESTINATION]';
const destICAO = () => { if(!curRoute) return '????'; const m=curRoute.dest.match(/\[(.+)\]/); return m?m[1]:'????'; };
const origICAO = () => curRoute ? curRoute.icao : '????';

// ═══════════════════════════════════════════════════════════════
//  WEATHER
// ═══════════════════════════════════════════════════════════════
// ICAO → approximate lat/lon for weather lookup
const ICAO_COORDS = {OPIS:[33.5494,72.8496],
  MDPC:[18.57, -68.91],
  KMNI:[40.74, -74.0],
  KABY:[31.54, -84.19],
  KBJC:[39.91, -105.11],
  KPAE:[47.9, -122.28],
  KJAC:[43.61, -110.74],
  KIWA:[33.31, -111.65],
  RJEB:[44.3, 143.4],
  CYEG:[53.31, -113.58],
  CYQB:[46.79, -71.39],
  DNAA:[9.0, 7.26],
  EFHK:[60.32, 24.96],
  FACT:[-33.96, 18.6],
  GMME:[34.04, -6.75],
  KABQ:[35.04, -106.61],
  KCLE:[41.41, -81.85],
  KDTW:[42.21, -83.35],
  KLGA:[40.78, -73.88],
  KPVU:[40.22, -111.72],
  KROC:[43.12, -77.67],
  KSDF:[38.17, -85.74],
  LEBL:[41.29, 2.08],
  LFBO:[43.63, 1.37],
  LFML:[43.44, 5.22],
  LPMA:[32.7, -16.77],
  LTAC:[40.12, 32.99],
  MYNN:[25.04, -77.47],
  NZAA:[-37.01, 174.79],
  OBBI:[26.27, 50.63],
  PAFA:[64.82, -147.86],
  RCKH:[22.58, 120.35],
  RCTP:[25.08, 121.23],
  RJAH:[36.18, 140.41],
  RJBB:[34.43, 135.24],
  RJCH:[41.77, 140.82],
  RJOC:[35.49, 132.88],
  RJSA:[40.73, 140.69],
  RJSS:[38.14, 140.92],
  RKPK:[35.18, 128.94],
  RPVM:[10.31, 123.98],
  SBEG:[-3.04, -60.05],
  TJSJ:[18.44, -66.0],
  VVNB:[21.22, 105.8],
  VVTS:[10.82, 106.65],
  WMKK:[2.74, 101.71],
  YPPH:[-31.94, 115.96],
  ZGGG:[23.39, 113.3],
  ZYHB:[45.62, 126.25],
  KMIA:[25.80,-80.28],KATL:[33.64,-84.43],KORD:[41.98,-87.91],KLAX:[33.94,-118.41],
  KJFK:[40.64,-73.78],KBOS:[42.36,-71.01],KEWR:[40.69,-74.17],KSEA:[47.45,-122.31],
  KDEN:[39.86,-104.67],KDFW:[32.90,-97.04],KIAH:[29.99,-95.34],KSFО:[37.62,-122.38],
  KSFO:[37.62,-122.38],KLAS:[36.08,-115.15],KPHX:[33.43,-112.01],KSAN:[32.73,-117.19],
  KPDX:[45.59,-122.60],KSLC:[40.79,-111.98],KBOI:[43.56,-116.22],KTUS:[32.12,-110.94],
  KAUS:[30.19,-97.67],KMSY:[29.99,-90.26],KMEM:[35.04,-89.98],KSTL:[38.75,-90.37],
  KCLT:[35.21,-80.94],KMSP:[44.88,-93.22],KMCO:[28.43,-81.31],KTPA:[27.98,-82.53],
  KBNA:[36.12,-86.68],KIND:[39.72,-86.29],KCVG:[39.05,-84.67],KPIT:[40.49,-80.23],
  KDCA:[38.85,-77.04],KIAD:[38.95,-77.46],KPHL:[39.87,-75.24],KBWI:[39.18,-76.67],
  EGLL:[51.48,-0.46],EDDF:[50.03,8.57],LFPG:[49.01,2.55],LEMD:[40.47,-3.57],
  LIRF:[41.79,12.25],EHAM:[52.31,4.77],LSZH:[47.46,8.55],LOWW:[48.11,16.57],
  EPWA:[52.17,20.97],LHBP:[47.43,19.26],LKPR:[50.10,14.26],UGTB:[41.67,44.95],
  OMDB:[25.25,55.36],OTHH:[25.27,51.61],OERK:[24.96,46.70],RJTT:[35.55,139.78],
  RJOO:[34.79,135.44],RKSI:[37.46,126.44],ZBAA:[40.08,116.59],VHHH:[22.31,113.92],
  ZSPD:[31.14,121.81],VABB:[19.09,72.87],WSSS:[1.36,103.99],VTBS:[13.69,100.75],
  VIDP:[28.56,77.12],FAOR:[-26.13,28.25],HECA:[30.12,31.40],LTFM:[41.28,28.75],
  CYYZ:[43.68,-79.63],CYUL:[45.47,-73.74],CYOW:[45.32,-75.67],CYYC:[51.11,-114.02],
  CYVR:[49.19,-123.18],SBGL:[-22.81,-43.25],SAEZ:[-34.82,-58.54],SCEL:[-33.40,-70.79],
  MMMX:[19.43,-99.07],MMMY:[25.86,-100.24],MSLP:[13.44,-89.05],MUHA:[22.99,-82.41],
  MKJP:[17.93,-76.78],SVMI:[10.60,-66.99],SMJP:[5.45,-55.19],SPJC:[-12.02,-77.11],
  RJCC:[42.77,141.69],RJOA:[34.44,132.92],ROAH:[26.20,127.65],
  PGUM:[13.48,144.80],RPLL:[14.51,121.02],RJFF:[33.58,130.45],RJSN:[37.96,139.12],
  RJGG:[35.26,136.92],ZMCK:[47.85,106.77],NCRG:[-21.20,-159.81],PANC:[61.17,-150.02],
  KRSW:[26.54,-81.76],KGEG:[47.62,-117.53],KOMA:[41.30,-95.89],KRAP:[44.05,-103.06],
  KFLG:[35.14,-111.67],KMDW:[41.79,-87.75],KFSD:[43.58,-96.74],KOKC:[35.39,-97.60],
  KCMH:[40.00,-82.89],KSTL:[38.75,-90.37],KMKE:[42.95,-87.90],KMCI:[39.30,-94.71],
  KJAX:[30.49,-81.69],KCRW:[38.37,-81.59],KSAT:[29.53,-98.47],KHOU:[29.65,-95.28],
  KELP:[31.81,-106.38],KSNA:[33.68,-117.87],KASE:[39.22,-106.87],KOAK:[37.72,-122.22],
  KEUG:[44.12,-123.22],KSBP:[35.24,-120.63],KGRR:[42.88,-85.52],BIRK:[64.13,-21.94],
  ENGM:[60.20,11.08],ESSA:[59.65,17.92],EKCH:[55.62,12.66],EFOU:[64.93,25.35],
  LPPT:[38.78,-9.13],LPPR:[41.24,-8.68],LEPA:[39.55,2.74],LICC:[37.47,15.07],
  LSZR:[47.48,9.56],LSZB:[46.91,7.50],LOWS:[47.80,13.00],LOWI:[47.26,11.34],
  LZIB:[48.17,17.21],LZKZ:[48.66,21.24],LZTT:[49.07,20.24],LKTB:[49.15,16.69],
  LKMT:[49.69,18.11],EPKK:[50.08,19.78],LDZA:[45.74,16.07],LDSP:[43.54,16.30],
  LGAV:[37.94,23.94],LMML:[35.86,14.48],LBWN:[43.23,27.83],LATI:[41.41,19.72],
  LXGB:[36.15,-5.35],UBBB:[40.47,50.05],LCLK:[34.87,33.62],LCPH:[34.72,32.49],
  OJAI:[31.72,35.99],DTTA:[36.85,10.23],EGPH:[55.95,-3.37],EGPF:[55.87,-4.43],
  EIDW:[53.43,-6.24],EGAA:[54.66,-6.22],EBBR:[50.90,4.48],EDDH:[53.63,10.00],
  EDDB:[52.37,13.52],EDDS:[48.69,9.22],EDDN:[49.49,11.08],EGCC:[53.35,-2.28],
  EGGP:[53.33,-2.85],EIDW:[53.43,-6.24],EICK:[51.84,-8.49],EGPH:[55.95,-3.37],
  LEBE:[43.30,-2.91],LTFM:[41.28,28.75],SBGE:[-3.04,-60.05],SBGE:[-3.04,-60.05],
  SEQM:[-0.13,-78.36],SBBE:[-1.38,-48.48],SKCL:[3.54,-76.38],SVCR:[11.41,-69.68],
  MMMD:[20.94,-89.66],MMUN:[21.04,-86.88],MMGL:[20.52,-103.31],MMHO:[29.09,-111.05],
  MGGT:[14.58,-90.53],MMGT:[14.58,-90.53],TNCA:[12.50,-70.01],CYWG:[49.91,-97.24],
  KPVD:[41.73,-71.43],KGEG:[47.62,-117.53],KBOI:[43.56,-116.22],KSMF:[38.70,-121.59],
  KSJC:[37.36,-121.93],KDEN:[39.86,-104.67],LEBB:[43.3,-2.91],PHNL:[21.32,-157.92],RCSS:[25.07,121.55],RJAA:[35.77,140.39],SBGR:[-23.43,-46.47],VDPP:[11.55,104.84],VMMC:[22.15,113.59],VVDN:[16.04,108.2],WADD:[-8.75,115.17],ZGSZ:[22.64,113.81],ZHCC:[34.52,113.84],ZSHC:[30.23,120.43],ZSNJ:[31.74,118.87],ZSQD:[36.27,120.37],
  ZSSS:[31.2,121.33],
  ZUCK:[29.72,106.64],
  ZUTF:[30.31,104.44],
  RSW:[26.54,-81.76]
};

function haversineDist(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var p1 = lat1*Math.PI/180, p2 = lat2*Math.PI/180;
  var dp = (lat2-lat1)*Math.PI/180, dl = (lon2-lon1)*Math.PI/180;
  var a = Math.sin(dp/2)*Math.sin(dp/2) + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)*Math.sin(dl/2);
  return 2*R*Math.asin(Math.sqrt(a));
}

function calcFlightTime(depIcao, destIcao) {
  var c1 = ICAO_COORDS[depIcao], c2 = ICAO_COORDS[destIcao];
  if (!c1 || !c2) return null;
  var dist = haversineDist(c1[0], c1[1], c2[0], c2[1]);
  var hours = dist / 880; // ~880 km/h typical cruise
  var h = Math.floor(hours);
  var m = Math.round((hours - h) * 60);
  if (m === 60) { h++; m = 0; }
  return { h: h, m: m, dist: Math.round(dist), str: h + 'h ' + (m > 0 ? m + 'min' : '') };
}

function getFlightTimeStr() {
  if (!curRoute || curRoute.multi) return '5 hours';
  var depIcao = curRoute.icao;
  var destMatch = (curRoute.dest || '').match(/\[([A-Z0-9]{4})\]/);
  if (!destMatch) return '5 hours';
  var ft = calcFlightTime(depIcao, destMatch[1]);
  if (!ft) return '5 hours';
  if (ft.h === 0) return ft.m + ' minutes';
  if (ft.m === 0) return ft.h + ' hours';
  return ft.h + ' hours ' + ft.m + ' minutes';
}
;


async function fetchWeather() {
  if (!curRoute) return;
  const icao = destICAO();
  const coords = ICAO_COORDS[icao];
  g('wx-btn').textContent = 'Fetching...';
  g('wx-btn').disabled = true;
  g('wx-status').textContent = 'Fetching weather...';
  g('wx-status').className = 'wx-val loading';

  try {
    let url;
    if (coords) {
      url = `https://api.open-meteo.com/v1/forecast?latitude=${coords[0]}&longitude=${coords[1]}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`;
    } else {
      throw new Error('No coords for ' + icao);
    }
    const res = await fetch(url);
    const data = await res.json();
    const cur = data.current;
    const tempC = Math.round(cur.temperature_2m);
    const tempF = Math.round(tempC * 9/5 + 32);
    const cond = wmoDesc(cur.weather_code);
    const wind = Math.round(cur.wind_speed_10m);
    const windDir = degToDir(cur.wind_direction_10m);

    wxData = { tempC, tempF, cond, wind, windDir };

    g('wx-temp').textContent = `${tempC}°C / ${tempF}°F`;
    g('wx-cond').textContent = cond;
    g('wx-wind').textContent = `${wind} km/h ${windDir}`;
    ['wx-temp-item','wx-cond-item','wx-wind-item'].forEach(id => g(id).style.display='flex');
    g('wx-status').style.display = 'none';
    g('wx-btn').textContent = 'Refresh Weather';
    g('wx-btn').disabled = false;
    update();
  } catch(e) {
    g('wx-status').textContent = `Weather unavailable for ${icao}`;
    g('wx-status').className = 'wx-val loading';
    g('wx-btn').textContent = 'Fetch Live Weather';
    g('wx-btn').disabled = false;
    wxData = null;
    update();
  }
}

function wmoDesc(code) {
  const WMO = {0:'clear skies',1:'mainly clear',2:'partly cloudy',3:'overcast',
    45:'foggy',48:'icy fog',51:'light drizzle',53:'moderate drizzle',55:'heavy drizzle',
    61:'light rain',63:'moderate rain',65:'heavy rain',71:'light snow',73:'moderate snow',
    75:'heavy snow',77:'snow grains',80:'light rain showers',81:'moderate rain showers',
    82:'heavy rain showers',85:'snow showers',86:'heavy snow showers',
    95:'thunderstorm',96:'thunderstorm with hail',99:'thunderstorm with heavy hail'};
  return WMO[code] || 'mixed conditions';
}
function degToDir(d) {
  const dirs=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(d/22.5)%16];
}

// ═══════════════════════════════════════════════════════════════
//  SCRIPT GENERATORS
// ═══════════════════════════════════════════════════════════════
function wxStr() {
  if (!wxData) return 'the weather at our destination';
  const {cond, tempC, tempF} = wxData;
  return `${cond} with temperatures of ${tempC} degrees Celsius and ${tempF} degrees Fahrenheit`;
}

function genCptBoard() {
  return `:n Ladies and gentlemen, this is Captain ${name()} speaking. On behalf of the entire flight crew, we would like to welcome you aboard our ${ac()} to ${destCity()}. | !wait 10 | :n We are expecting a flight time of approximately ${getFlightTimeStr()}, and our flight path looks clear. | !wait 10 | :n As a reminder, you are legally required to follow all instructions and directions from our Cabin Crew personnel. We thank you for your cooperation and we hope you enjoy the flight.`;
}
function genCptArr() {
  return `:n Ladies and gentlemen, this is Captain ${name()} speaking. As you can see we have arrived at ${destCity()}, the weather is ${wxStr()}. | !wait 10 | :n On behalf of the flight crew, we would like to wish you a lovely holiday or welcome you back home. Thank you for flying with South Pacific Airways and we hope to see you again soon.`;
}
function genFOCruise() {
  return `:n Ladies and gentlemen, this is First Officer ${name()} speaking. I'm happy to announce that we have reached our cruising altitude of 35,000 feet, which is roughly 11 kilometers or 7 miles. | !wait 10 | :n We are expecting a clear flight path up ahead. Estimated remaining flight time is ${getFlightTimeStr()}. Cabin Crew will be coming through the cabin to serve meals and beverages shortly. We hope you enjoy the flight!`;
}
function genFODescEarly() {
  return `:n Ladies and gentlemen, this is First Officer ${name()} speaking. We have begun our initial descent into ${destCity()}. At this time, feel free to use the lavatories before the seatbelt sign is turned on. | !wait 10 | :n Cabin Crew will be passing through the cabin for the last time to collect any rubbish, magazines, or unused items shortly. | !wait 10 | :n Cabin Crew, prepare for arrival.`;
}
function genFODesc() {
  return `:n Ladies and gentlemen, this is First Officer ${name()} speaking. We have begun our initial descent into ${destCity()} and will be landing shortly. | !wait 10 | :n At this time, Cabin Crew will be passing through for the last time to collect any rubbish, magazines, or unused items. We hope you have had a pleasant flight with us. | !wait 10 | :n Cabin Crew, prepare for arrival.`;
}
function genFO1500() {
  return `:n Ladies and gentlemen, the seatbelt sign has now been turned on. Please return to your seats and ensure your seatbelt is securely fastened. We hope you have enjoyed your flight with us. | !wait 10 | :n Cabin Crew, prepare for landing.`;
}

// ═══════════════════════════════════════════════════════════════
//  FO CHECKLIST  (phases + full commands)
// ═══════════════════════════════════════════════════════════════
const FO_CHECKLIST = [
  {phase:"When Parked", items:[
    {text:"-Battery ON-",                                                                      cmd:":scriptchat fd [FO] -Battery ON-"},
    {text:"-External Power ON-",                                                               cmd:":scriptchat fd [FO] -External Power ON-"},
    {text:"-Packs ON-",                                                                        cmd:":scriptchat fd [FO] -Packs ON-"},
    {text:"-LOGO lights ON-",                                                                  cmd:":scriptchat fd [FO] -LOGO lights ON-"},
    {text:"-Nav Lights ON-",                                                                   cmd:":scriptchat fd [FO] -Nav Lights ON-"},
  ]},
  {phase:"GPU Disconnected", items:[
    {text:"-External power OFF-",                                                              cmd:":scriptchat fd [FO] -External power OFF-"},
    {text:"-APU ON-",                                                                          cmd:":scriptchat fd [FO] -APU ON-"},
  ]},
  {phase:"After APU is on", items:[
    {text:"-APU Bleed ON-",                                                                    cmd:":scriptchat fd [FO] -APU Bleed ON-"},
    {text:"-Prints and signs departure documents-",                                            cmd:":scriptchat fd [FO] -Prints and signs departure documents-"},
    {text:"-Sets Heading, Altitude, and speed variables into the autopilot for departure-",    cmd:":scriptchat fd [FO] -Sets Heading, Altitude, and speed variables into the autopilot for departure-"},
  ]},
  {phase:"Door Closing", items:[
    {text:"Doors closed and locked Checked.",                                                  cmd:":scriptchat fd [FO] Doors closed and locked Checked."},
    {text:"-Beacon ON-",                                                                       cmd:":scriptchat fd [FO] -Beacon ON-"},
    {text:"Ready for engine start and push.",                                                  cmd:":scriptchat fd [FO] Ready for engine start and push."},
    {text:"-Fuel Pumps ON and Running-",                                                       cmd:":scriptchat fd [FO] -Fuel Pumps ON and Running-"},
    {text:"Starting Engine ONE",                                                               cmd:":scriptchat fd [FO] Starting Engine ONE"},
  ]},
  {phase:"Airbus Start Up", items:[
    {text:"-Start Switch set to ignition-",                                                    cmd:":scriptchat fd [FO] -Start Switch set to ignition-"},
    {text:"-Engine ONE Master switch ON-",                                                     cmd:":scriptchat fd [FO] -Engine ONE Master switch ON-"},
  ]},
  {phase:"Airbus Pushback Complete", items:[
    {text:"-Taxi Lights ON-",                                                                  cmd:":scriptchat fd [FO] -Taxi Lights ON-"},
    {text:"-Flaps Set 2 for Takeoff-",                                                        cmd:":scriptchat fd [FO] -Flaps Set 2 for Takeoff-"},
    {text:"Good start Engine ONE starting Engine Two.",                                        cmd:":scriptchat fd [FO] Good start Engine ONE starting Engine Two."},
    {text:"-Engine TWO Master switch ON-",                                                     cmd:":scriptchat fd [FO] -Engine TWO Master switch ON-"},
    {text:"Good start Engine TWO.",                                                            cmd:":scriptchat fd [FO] Good start Engine TWO."},
    {text:"-Start switch set to RUN-",                                                         cmd:":scriptchat fd [FO] -Start switch set to RUN-"},
    {text:"-APU, APU Bleed, OFF-",                                                             cmd:":scriptchat fd [FO] -APU, APU Bleed, OFF-"},
  ]},
  {phase:"Entering Runway", items:[
    {text:"Runway 32 out the window.",                                                         cmd:":scriptchat fd [FO] Runway 32 out the window."},
    {text:"-Strobe and Landing ON-",                                                           cmd:":scriptchat fd [FO] -Strobe and Landing ON-"},
    {text:"Engines Stable, Takeoff thrust Set.",                                               cmd:":scriptchat fd [FO] Engines Stable, Takeoff thrust Set."},
    {text:"V1 Rotate.",                                                                        cmd:":scriptchat fd [FO] V1 Rotate."},
    {text:"Positive climb, gear up.",                                                          cmd:":scriptchat fd [FO] Positive climb, gear up."},
    {text:"-Taxi Light OFF, Gear up-",                                                         cmd:":scriptchat fd [FO] -Taxi Light OFF, Gear up-"},
  ]},
  {phase:"Climbing", items:[
    {text:"Stable Climb, Speed Checked, Flaps up, Landing Lights Off.",                        cmd:":scriptchat fd [FO] Stable Climb, Speed Checked, Flaps up, Landing Lights Off."},
  ]},
  {phase:"10,000ft", items:[
    {text:"10,000 Feet checked, cabin announcement complete.",                                 cmd:":scriptchat fd [FO] 10,000 Feet checked, cabin announcement complete."},
  ]},
  {phase:"Cruising", items:[
    {text:"35,000 Feet checked, stable cruise.",                                               cmd:":scriptchat fd [FO] 35,000 Feet checked, stable cruise."},
  ]},
  {phase:"PA — When Cruising", items:[
    {text:"PA: Cruising altitude announcement",                                                cmd:":n Ladies and gentlemen, this is First Officer [NAME] speaking. I'm happy to announce that we have reached our cruising altitude of 35,000 feet, which is roughly 11 kilometers or 7 miles. | !wait 10 | :n We are expecting a clear flight path up ahead. Estimated remaining flight time is ${getFlightTimeStr()}. Cabin Crew will be coming through the cabin to serve meals and beverages shortly. We hope you enjoy the flight!"},
  ]},
  {phase:"PA — After Service, Before Descent", items:[
    {text:"PA: Initial descent announcement",                                                  cmd:":n Ladies and gentlemen, this is your First Officer [NAME] speaking. We have begun our initial descent into [DESTINATION] and will be landing shortly. | !wait 10 | :n At this time, Cabin Crew will be passing through for the last time to collect any rubbish, magazines, or unused items. We hope you have had a pleasant flight with us. | !wait 10 | :n Cabin Crew, prepare for arrival."},
  ]},
  {phase:"Descent — 10,000ft", items:[
    {text:"10,000 Feet, Speed Checked, Flaps 1.",                                              cmd:":scriptchat fd [FO] 10,000 Feet, Speed Checked, Flaps 1."},
  ]},
  {phase:"Descent — 7,000ft", items:[
    {text:"7,000 Feet, Speed Checked, Flaps 2.",                                               cmd:":scriptchat fd [FO] 7,000 Feet, Speed Checked, Flaps 2."},
  ]},
  {phase:"PA — At 1,500ft", items:[
    {text:"PA: Seatbelt sign on",                                                              cmd:":n Cabin Crew, prepare for landing."},
  ]},
  {phase:"Approach — 5,000ft", items:[
    {text:"5,000 Feet. Speed Checked, Flaps 3.",                                               cmd:":scriptchat fd [FO] 5,000 Feet. Speed Checked, Flaps 3."},
    {text:"-Approach Mode ON-",                                                                cmd:":scriptchat fd [FO] -Approach Mode ON-"},
  ]},
  {phase:"Final Approach — 3,000ft", items:[
    {text:"Final approach 3,000 Feet, Speed Checked, Flaps full.",                             cmd:":scriptchat fd [FO] Final approach 3,000 Feet, Speed Checked, Flaps full."},
    {text:"-Gear Down-",                                                                       cmd:":scriptchat fd [FO] -Gear Down-"},
    {text:"-Landing Lights ON-",                                                               cmd:":scriptchat fd [FO] -Landing Lights ON-"},
    {text:"Gear down, all green.",                                                             cmd:":scriptchat fd [FO] Gear down, all green."},
    {text:"-Taxi Lights ON-",                                                                  cmd:":scriptchat fd [FO] -Taxi Lights ON-"},
  ]},
  {phase:"Landing", items:[
    {text:"Touchdown, Speed Brakes up, 2 in reverse, Normal.",                                 cmd:":scriptchat fd [FO] Touchdown, Speed Brakes up, 2 in reverse, Normal."},
    {text:"60 KTS Disengage.",                                                                 cmd:":scriptchat fd [FO] 60 KTS Disengage."},
  ]},
  {phase:"Exiting Runway", items:[
    {text:"Runway vacation complete.",                                                         cmd:":scriptchat fd [FO] Runway vacation complete."},
    {text:"-Landing and Strobe OFF-",                                                          cmd:":scriptchat fd [FO] -Landing and Strobe OFF-"},
    {text:"-Flaps UP-",                                                                        cmd:":scriptchat fd [FO] -Flaps UP-"},
    {text:"-APU, APU Bleed ON, PACKS ON-",                                                     cmd:":scriptchat fd [FO] -APU, APU Bleed ON, PACKS ON-"},
  ]},
  {phase:"Ground Marshal in View", items:[
    {text:"Marshal in sight, taxi light off.",                                                 cmd:":scriptchat fd [FO] Marshal in sight, taxi light off."},
    {text:"-Taxi Light OFF-",                                                                  cmd:":scriptchat fd [FO] -Taxi Light OFF-"},
  ]},
  {phase:"Parked / Anchored", items:[
    {text:"-Parking Brakes Set-",                                                              cmd:":scriptchat fd [FO] -Parking Brakes Set-"},
    {text:"-Beacon OFF-",                                                                      cmd:":scriptchat fd [FO] -Beacon OFF-"},
  ]},
  {phase:"Airbus Shutdown", items:[
    {text:"Shutdown sequence.",                                                                cmd:":scriptchat fd [FO] Shutdown sequence."},
    {text:"-Engine 1 and Engine 2 master switches off-",                                       cmd:":scriptchat fd [FO] -Engine 1 and Engine 2 master switches off-"},
    {text:"External Power AVL",                                                                cmd:":scriptchat fd [FO] External Power AVL"},
    {text:"-External Power ON-",                                                               cmd:":scriptchat fd [FO] -External Power ON-"},
    {text:"-Fuel Pumps OFF-",                                                                  cmd:":scriptchat fd [FO] -Fuel Pumps OFF-"},
    {text:"-PTU OFF-",                                                                         cmd:":scriptchat fd [FO] -PTU OFF-"},
    {text:"Shutdown Complete.",                                                                cmd:":scriptchat fd [FO] Shutdown Complete."},
    {text:"Flight Deck ready for deboarding.",                                                 cmd:":scriptchat fd [FO] Flight Deck ready for deboarding."},
  ]},
];

function buildFOChecklist() {
  const el = g('fo-checklist');
  const nm  = (g('inp-name') ? g('inp-name').value.trim() : '') || '[NAME]';
  const dst = (curRoute && !curRoute.multi)
    ? curRoute.dest.replace(/\s*\[.*?\]/,'')
    : '[DESTINATION]';
  el.innerHTML = FO_CHECKLIST.map(function(phase, pi) {
    return '<div class="cl-phase"><div class="cl-phase-title">'+phase.phase+'</div>'
      + phase.items.map(function(item, ii) {
          var key = pi+'-'+ii;
          var done = clState[key];
          var isPA = item.text.indexOf('PA:') === 0;
          var resolved = (item.cmd||'')
            .replace(/\[NAME\]/g, nm)
            .replace(/\[DESTINATION\]/g, dst)
            .replace(/\$\{getFlightTimeStr\(\)\}/g, getFlightTimeStr());
          var safe = resolved.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
          var textStyle = isPA ? 'color:#60a5fa;font-weight:600' : '';
          var cmdStyle  = isPA ? 'color:#60a5fa' : '';
          return '<div class="cl-item'+(done?' done':'')+'" onclick="toggleCL(\''+key+'\',this)">'
            +'<input type="checkbox"'+(done?' checked':'')+' onclick="event.stopPropagation();toggleCL(\''+key+'\',this.closest(\'.cl-item\'))">'
            +'<div style="flex:1">'
            +'<span class="cl-text" style="'+textStyle+'">'+item.text+'</span>'
            +(item.cmd
              ? '<span class="cl-cmd" style="'+cmdStyle+'" onclick="event.stopPropagation();cpText(\''+safe+'\')">'+resolved+' <span style="color:var(--sub);font-size:.65rem">(click to copy)</span></span>'
              : '')
            +'</div></div>';
        }).join('')
      +'</div>';
  }).join('');
}
function toggleCL(key, el) {
  clState[key] = !clState[key];
  el.classList.toggle('done', clState[key]);
  el.querySelector('input').checked = clState[key];
}
function resetChecklist() {
  clState = {};
  buildFOChecklist();
  if (curRoute && !curRoute.multi) addRecent('SPA' + (g('inp-rid').value.trim()));
}

// ═══════════════════════════════════════════════════════════════
//  SECOND OFFICER SCRIPTS
// ═══════════════════════════════════════════════════════════════
function buildSOSection(title, rows) {
  return `<div class="s-section"><h3>${title}</h3>${rows.map(([type, text]) => `
  <div class="atc-row">
    <span class="badge b-${type}">${type.toUpperCase()}</span>
    <div class="s-block" onclick="cp(this)">
      <span class="copy-hint">click to copy</span>
      <div class="s-text">${text}</div>
    </div>
  </div>`).join('')}</div>`;
}

function buildSO() {
  const R = rid(), G = gate(), O = origICAO(), D = destICAO();

  const sections = [
    ["Ground Crew Comms — When Parked",[
      ["gc", `:scriptchat gc [GC] ${R}, Ground Crew, confirm communications test is successful.`],
      ["fd", `:scriptchat fd [FD] Ground Crew, communications test is successful.`],
      ["gc", `:scriptchat gc [GC] ${R}, Ground Crew, confirm parking brake is set.`],
      ["fd", `:scriptchat fd [FD] Ground Crew, parking brake confirmed to be set.`],
      ["gc", `:scriptchat gc [GC] ${R}, Ground Crew, confirm clearance to attach ground vehicles.`],
      ["fd", `:scriptchat fd [FD] Ground Crew, clear to attach all necessary ground vehicles.`],
    ]],
    ["Ground Crew — Before Detach",[
      ["gc", `:scriptchat gc [GC] ${R}, Ground Crew, confirm clearance to detach all ground vehicles.`],
      ["fd", `:scriptchat fd [FD] Ground Crew, clear to detach ground vehicles.`],
    ]],
    [`IFR Clearance — Before Boarding (XX:50–XX:10)`,[
      ["fd", `:scriptchat fd [FD] ${O} clearance, ${R} at ${G}, requesting IFR clearance to ${D}.`],
      ["atc",`:scriptchat atc [ATC] ${R} IFR clearance to ${D} approved, using the departure SID then as filed, expect flight level 350, 10 minutes after departure and expect runway 32, contact ground when ready to push.`],
      ["fd", `:scriptchat fd [FD] Cleared to ${D} via the departure SID then as filed going to flight level 350, 10 minutes after departure. we'll contact ground when ready to push, thanks.`],
    ]],
    ["When Ready for Pushback",[
      ["fd", `:scriptchat fd [FD] ${O} ground, ${R} with current, request push and start.`],
      ["atc",`:scriptchat atc [ATC] ${R} push and start approved, push tail left.`],
      ["fd", `:scriptchat fd [FD] Pushing back tail to the left, ${R}.`],
    ]],
    ["When Ready for Taxi",[
      ["fd", `:scriptchat fd [FD] ${O} Ground ${R} on Bravo, ready for taxi.`],
      ["atc",`:scriptchat atc [ATC] ${R} taxi to active, runway 32 via, Bravo, Charlie.`],
      ["fd", `:scriptchat fd [FD] Taxi to active, runway 32 via Bravo, Charlie. ${R}.`],
    ]],
    ["At End of Taxi / Holding Short",[
      ["atc",`:scriptchat atc [ATC] ${R} monitor the frequency.`],
      ["fd", `:scriptchat fd [FD] Monitor the frequency ${R}.`],
      ["atc",`:scriptchat atc [ATC] ${R}, runway 32 cleared for takeoff.`],
      ["fd", `:scriptchat fd [FD] Runway 32 cleared for takeoff ${R}.`],
    ]],
    ["Shortly After Takeoff",[
      ["atc",`:scriptchat atc [ATC] ${R} contact departure.`],
      ["fd", `:scriptchat fd [FD] Over to departure ${R}, G'day.`],
      ["fd", `:scriptchat fd [FD] ${O} departure, ${R} is with you flying on route as filed.`],
      ["atc",`:scriptchat atc [ATC] Roger, ${R} cleared to flight level 350, continue route as filed.`],
      ["fd", `:scriptchat fd [FD] Cleared up to flight level 350.`],
    ]],
    ["During Cruise",[
      ["atc",`:scriptchat atc [ATC] ${R} frequency change to destination center approved. G'day.`],
      ["fd", `:scriptchat fd [FD] Over to arrival center.`],
      ["fd", `:scriptchat fd [FD] Good morning center, ${R} with you at Flight Level 350.`],
      ["atc",`:scriptchat atc [ATC] Copy, welcome ${R}.`],
    ]],
    ["Before Descent",[
      ["fd", `:scriptchat fd [FD] ${R} requesting permission to descend to flight level 200.`],
      ["atc",`:scriptchat atc [ATC] ${R} cleared to descend to flight level 200, continue route as filed.`],
      ["atc",`:scriptchat atc [ATC] ${R} change frequency over to arrival.`],
      ["fd", `:scriptchat fd [FD] Changing frequency to arrival, ${R}.`],
    ]],
    ["During Descent",[
      ["fd", `:scriptchat fd [FD] ${D} arrival ${R} with current for arrival into ${D}.`],
      ["atc",`:scriptchat atc [ATC] ${R} welcome, keep your own navigation expect the ILS for runway 34L.`],
      ["fd", `:scriptchat fd [FD] Continuing with our own navigation, ${R}.`],
    ]],
    ["On Approach",[
      ["atc",`:scriptchat atc [ATC] ${R} Over to Tower.`],
      ["fd", `:scriptchat fd [FD] Contacting tower ${R}.`],
      ["fd", `:scriptchat fd [FD] Tower ${R} on approach to runway 34L.`],
      ["atc",`:scriptchat atc [ATC] ${R} runway 34L cleared to land.`],
      ["fd", `:scriptchat fd [FD] Cleared to land runway 34L, ${R}.`],
    ]],
    ["After Landing",[
      ["atc",`:scriptchat atc [ATC] ${R} contact ground, and welcome.`],
      ["fd", `:scriptchat fd [FD] Over to ground ${R}, thanks.`],
      ["fd", `:scriptchat fd [FD] Ground ${R} off runway 34L on Alpha 6, request taxi to the ramp.`],
      ["atc",`:scriptchat atc [ATC] ${R} taxi to the ramp, via Alpha 6, Zulu, Tango.`],
      ["fd", `:scriptchat fd [FD] To the ramp, via Alpha 6, Zulu, Tango, for ${R}.`],
    ]],
  ];

  return sections.map(([t,rows]) => buildSOSection(t,rows)).join('');
}

// ═══════════════════════════════════════════════════════════════
//  MAIN UPDATE
// ═══════════════════════════════════════════════════════════════
// flight paths per airport (from the Airport Charts PDF)
var FLIGHT_PATHS = {"Summit Peak": [["Path A", ""], ["Path B", ""], ["Path C", "experienced only"], ["Path D", "experienced only"]], "Mark Neris": [["Path A", ""], ["Path B", ""]], "Punta Cana": [["Path A", "will be updated"], ["Path B", "will be updated"], ["Path C", "experienced only, will be updated"]], "London Heathrow": [["Path A", ""], ["Path B", ""], ["Path C", ""]], "Monbetsu Regional": [["Path A", ""], ["Path B", ""], ["Path C", "inoperable"], ["Path D", ""]], "Southwest Regional": [["Path A", ""], ["Path B", ""], ["Path C", ""]], "Mesa Gateway": [["Path A", ""], ["Path B", ""], ["Path C", ""], ["Path D", ""], ["Path E", ""], ["Path F", ""]], "Jackson Hole": [["Path A", ""], ["Path B", ""], ["Path C", ""], ["Path D", ""]]};
var FP_NAME = { 'Monbetsu': 'Monbetsu Regional', 'Mesa Regional': 'Mesa Gateway' };
function fillFlightPaths(airport) {
  var sel = g('inp-path');
  var list = sel && FLIGHT_PATHS[FP_NAME[airport] || airport];
  if (!list) return;
  var cur = sel.value;
  sel.innerHTML = list.map(function (p) {
    return '<option value="' + p[0] + '">' + p[0] + (p[1] ? ' (' + p[1] + ')' : '') + '</option>';
  }).join('');
  sel.value = list.some(function (p) { return p[0] === cur; }) ? cur : list[0][0];
}
function update() {
  const numStr = g('inp-rid').value.trim();
  curRoute = lookupRoute(numStr);
  fillFlightPaths(curRoute && curRoute.airport);

  // Route header
  const hdr = g('route-hdr');
  if (curRoute && curRoute.multi) {
    // Multiple airports share this ID
    hdr.innerHTML = '<div style="font-size:.85rem;color:var(--orange);margin-bottom:6px">⚠️ Route <b>' + curRoute.id + '</b> exists at multiple airports — select yours:</div>' +
      curRoute.multi.map((r,i) => {
        const acSugg = acSuggest(r.ac);
        return '<div style="cursor:pointer;padding:8px 12px;background:'+(i===0?'#0f2540':'#0a1d36')+';border:1px solid '+(i===0?'#2196f3':'#1a3456')+';border-radius:8px;margin-bottom:6px" onclick="selectMultiRoute('+i+')">'
          + '<span style="color:var(--accent)">'+r.id+'</span> | '+r.airport+' ['+r.icao+'] → '+r.dest
          + '<div style="font-size:.75rem;color:var(--sub);margin-top:3px">'+acSugg+'</div></div>';
      }).join('');
    // default to first
    if (!curRoute.airport) { const m=curRoute.multi[0]; curRoute={...m}; }
  } else if (curRoute) {
    const acSugg = acSuggest(curRoute.ac);
    const paths = (ROUTES[curRoute.airport]?.paths||[]).join(' · ');
    var _ft = getFlightTimeStr();
    hdr.innerHTML = '<div><span class="rh-id">'+curRoute.id+'</span> | '+curRoute.airport+' ['+curRoute.icao+'] → '+curRoute.dest+'</div>'
      + '<div class="rh-ac">Aircraft: '+acSugg+(curRoute.xlr?' · <span style="color:var(--accent2)">XLR</span>':'')+'</div>'
      + (paths ? '<div class="rh-ac" style="margin-top:2px;color:#4a7aaa">Paths: '+paths+'</div>' : '')
      + '<div class="rh-ac" style="margin-top:4px;color:#1db954;font-weight:600">🕐 Est. Flight Time: '+_ft+'</div>';
  } else if (numStr) {
    hdr.innerHTML = '<span class="route-not-found">Route SPA'+numStr+' not found in database</span>';
  } else {
    hdr.textContent = 'Enter a Route ID above';
  }

  // Charts row
  const chartKey = curRoute ? CHART_MAP[curRoute.airport] : null;
  g('charts-toggle-row').style.display = chartKey ? 'flex' : 'none';
  if (_chartsVisible) renderInlineCharts();

  // Weather button
  if (curRoute) {
    g('wx-btn').style.display = 'inline-block';
    if (!wxData) {
      g('wx-status').style.display = 'inline';
      g('wx-status').textContent = `Click to fetch live weather for ${destCity()}`;
      g('wx-status').className = 'wx-val loading';
    }
  } else {
    g('wx-btn').style.display = 'none';
    g('wx-status').style.display = 'inline';
    g('wx-status').textContent = 'enter route ID first';
    g('wx-status').className = 'wx-val loading';
    ['wx-temp-item','wx-cond-item','wx-wind-item'].forEach(id=>g(id).style.display='none');
    wxData = null;
  }

  // Scripts - null-guarded
  var _ids = {'cpt-board':genCptBoard,'cpt-arr':genCptArr,'fo-cruise':genFOCruise,'fo-desc-early':genFODescEarly,'fo-desc':genFODesc,'fo-1500':genFO1500};
  Object.keys(_ids).forEach(function(id){ var el=g(id); if(el) el.textContent=_ids[id](); });
  var soEl=g('so-scripts'); if(soEl) soEl.innerHTML=buildSO();
  buildFOChecklist();
}

function acSuggest(cat) {
  const map = {
    'A318/A319':'Airbus A318 or A319',
    'A220/A320/B737':'Airbus A220, A320, or Boeing 737 MAX 8',
    'A321neo':'Airbus A321neo',
    'B737MAX8':'Boeing 737 MAX 8',
    'Widebody':'A330-941neo / B777-300ER / B787-9 / A350-900',
    'A380/B747':'Airbus A380 or Boeing 747',
  };
  return map[cat] || cat || '—';
}

// ═══════════════════════════════════════════════════════════════
//  CHARTS
// ═══════════════════════════════════════════════════════════════
var _chartsVisible = false;
function toggleCharts(btn) {
  _chartsVisible = !_chartsVisible;
  btn.textContent = _chartsVisible ? '📊 Hide Charts' : '📊 Show Charts';
  btn.style.background = _chartsVisible ? 'rgba(59,130,246,.18)' : 'rgba(59,130,246,.08)';
  renderInlineCharts();
}
function renderInlineCharts() {
  const el = g('inline-charts');
  const show = _chartsVisible;
  el.classList.toggle('show', show);
  if (!show || !curRoute) return;
  const key = CHART_MAP[curRoute.airport];
  if (!key || !CHARTS[key]) return;
  el.innerHTML = Object.entries(CHARTS[key]).map(([n,b64])=>
    `<div class="chart-card"><img src="${b64.indexOf('images/') === 0 ? b64 : 'data:image/jpeg;base64,' + b64}" alt="${n}" onclick="openModal(this.src)"><p>${n}</p></div>`
  ).join('');
}

function renderChartsPage() {
  const sel = g('chart-ap-sel').value;
  const el = g('charts-page');
  if (!sel || !CHARTS[sel]) { el.innerHTML=''; return; }
  el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px">` +
    Object.entries(CHARTS[sel]).map(([n,b64])=>
      `<div class="chart-card"><img src="${b64.indexOf('images/') === 0 ? b64 : 'data:image/jpeg;base64,' + b64}" alt="${n}" onclick="openModal(this.src)"><p>${n}</p></div>`
    ).join('') + '</div>';
}

function openModal(src) {
  // scale the chart up to fill the screen (small trimmed images would otherwise stay small)
  const im = g('modal-img');
  im.onload = function () {
    const r = im.naturalWidth / im.naturalHeight;
    const w = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.9 * r);
    im.style.width = w + 'px';
    im.style.height = 'auto';
  };
  im.src = '';
  im.src = src;
  g('modal').classList.add('open');
}
function closeModal() { g('modal').classList.remove('open'); }

// ═══════════════════════════════════════════════════════════════
//  CABIN CREW SCRIPTS
// ═══════════════════════════════════════════════════════════════
const CC = {
  "🛬 Boarding":{needsUser:false,dual:false,scripts:[
    {l:"Short greeting",t:"Welcome aboard!"},
    {l:"Extended greeting",t:"Welcome aboard! Have a pleasant flight!"},
    {l:"Formal greeting",t:"Welcome aboard! Really glad to have you with us today."},
  ]},
  "🍹 Pre-Flight Service":{needsUser:false,dual:false,scripts:[
    {l:"RP",t:"-pulls out drink tray-"},{l:"RP",t:"-pulls out fancy cups and napkins-"},
    {l:"RP",t:"-puts cups in chiller-"},{l:"RP",t:"-grabs bag of ice-"},
    {l:"RP",t:"-crushes ice with mallet and dumps in icebox-"},{l:"RP",t:"-sets drink platter aside-"},
    {l:"Pre-flight greeting",t:"Welcome on board! Can I get you a drink before we head off?"},
    {l:"After serving",t:"Enjoy!"},
  ]},
  "🔒 Arming":{needsUser:false,dual:false,scripts:[
    {l:"RP",t:"-unclicks & places red flag across window-"},
    {l:"RP",t:"-crouches onto floor towards door-"},
    {l:"RP",t:"-detaches girt bar from hooks-"},
    {l:"RP",t:"-inserts girt bar into floor brackets-"},
  ]},
  "🔓 Disarming":{needsUser:false,dual:false,scripts:[
    {l:"RP",t:"-crouches onto floor towards door-"},
    {l:"RP",t:"-detaches girt bar from floor brackets-"},
    {l:"RP",t:"-stows girt bar into hooks-"},
    {l:"RP",t:"-unclicks & places red flag to normal position-"},
  ]},
  "🍱 Cruising Setup":{needsUser:false,dual:false,scripts:[
    {l:"RP",t:"-pulls out galley cart-"},{l:"RP",t:"-stocks with food and drinks-"},
    {l:"RP",t:"-grabs bag of ice and crushes with mallet-"},{l:"RP",t:"-dumps in icebox-"},
    {l:"RP (premium)",t:"-pours warm water over towels-"},{l:"RP (premium)",t:"-places towels in heated chiller-"},
  ]},
  "🧣 Warm Towels":{needsUser:true,dual:false,scripts:[
    {l:"Warm towel greeting",t:"Welcome to the skies! May I offer you a warm towel for freshening up before meal service?"},
    {l:"Give warm towel",t:":give (user) warm"},
    {l:"Notify CM done",t:":notify %sta Warm Towels [Section/Side] Done - [USERNAME]"},
  ]},
  "✈️ Cruising Service":{needsUser:true,dual:true,scripts:[
    {l:"Cruising greeting",t:"Salutations! My name is [NAME] and I am your Flight Attendant for this flight. Please check our menu card, we offer various nutritious meals from all over the world. Let me know once you are ready to submit your order!",greetOnly:true},
    {l:"PM command",t:":pm user,user,user [GREETING]",greetOnly:true},
    {l:"PM whole Business",t:":pm bc [GREETING]"},
    {l:"PM whole Economy",t:":pm eco [GREETING]"},
    {l:"PM whole Investor",t:":pm inv [GREETING]"},
    {l:"PM whole First Class",t:":pm fc [GREETING]"},
    {l:"After serving",t:"Enjoy!"},
    {l:"Notify CM done",t:":notify %sta [Section] - finished. - [USERNAME]",serveOnly:true},
    {l:"Track all pax",t:":track nonadmins"},
    {l:"Track premium",t:":track inv,fc,bc"},
  ]},
  "🗑️ Trash & Clean-Up":{needsUser:false,dual:false,scripts:[
    {l:"Get trash bag",t:":give me trash"},{l:"RP",t:"-collects trash-"},
    {l:"RP",t:"-grabs meal tray-"},{l:"RP",t:"-checks inventory of food & drink items-"},
    {l:"RP",t:"-stows food carts and locks them in place-"},
    {l:"RP",t:"-opens upper compartment and puts drink & towel platter-"},
    {l:"RP",t:"-locks compartment in place-"},{l:"RP",t:"-wipes off galley with wet wipe-"},
  ]},
  "🛬 Deboarding":{needsUser:false,dual:false,scripts:[
    {l:"Farewell",t:"Goodbye! Thank you for flying with South Pacific Airways!"},
    {l:"Short farewell",t:"Farewell! Thank you for choosing SPA!"},
    {l:"Warm farewell",t:"Was great having you on board! Safe travels, hope to see you again soon!"},
  ]},
  "📢 Notify Commands":{needsUser:true,dual:false,scripts:[
    {l:"Pre-flight done",t:":notify %sta Pre-Flight Service Done - [USERNAME]"},
    {l:"Warm towels done",t:":notify %sta Warm Towels [Section/Side] Done - [USERNAME]"},
    {l:"Section done",t:":notify %sta [Section] - finished. - [USERNAME]"},
    {l:"Premium CPT done",t:":notify %sta Premium CPT served - [USERNAME]"},
    {l:"Economy FO done",t:":notify %sta Economy FO served - [USERNAME]"},
  ]},
  "🎫 Upgrade Commands":{needsUser:true,dual:false,scripts:[
    {l:"Investor",t:":give (user) Investor | :give (user) Lounge | :give (user) Flight"},
    {l:"First Class",t:":give (user) First | :give (user) Lounge | :give (user) Flight"},
    {l:"Business",t:":give (user) Business | :give (user) Lounge | :give (user) Flight"},
    {l:"Economy",t:":give (user) Economy | :give (user) Flight"},
  ]},
  "🛠️ Admin Commands":{needsUser:false,dual:false,scripts:[
    {l:"Drinks Platter",t:":give me drinks"},{l:"Food Cart",t:":give me food"},
    {l:"Warm Towels Tray",t:":give me tray"},{l:"Trash Bag",t:":give me trash"},
    {l:"CC Suitcase (walk)",t:":give me cabin"},{l:"Ask Me Sign (CSA)",t:":give me ask"},
    {l:"Show all usernames",t:":track all"},{l:"Non-admin usernames",t:":track nonadmins"},
    {l:"Track age group chat",t:":chatlogs true"},{l:"Open notepad",t:"!notepad"},
    {l:"Staff notification",t:":notify %sta [MSG] - [USERNAME]"},
    {l:"DM passengers",t:":pm [USER(S)] [MSG]"},{l:"Freecam (gate)",t:":freecam (user)"},
  ]},
    "🔒 Arming & Disarming (by Aircraft)":{
    needsUser:false,dual:false,scripts:[
      {l:"── B737 (737-8MAX, 737-890) ── ARMING",t:"── B737 (737-8MAX, 737-890) ── ARMING"},
      {l:"Arm",t:"-unclicks & places red flag across window-"},
      {l:"Arm",t:"-crouches onto floor towards door-"},
      {l:"Arm",t:"-detaches girt bar from hooks-"},
      {l:"Arm",t:"-inserts girt bar into floor brackets-"},
      {l:"── B737 (737-8MAX, 737-890) ── DISARMING",t:"── B737 (737-8MAX, 737-890) ── DISARMING"},
      {l:"Disarm",t:"-crouches onto floor towards door-"},
      {l:"Disarm",t:"-detaches girt bar from floor brackets-"},
      {l:"Disarm",t:"-stows girt bar into hooks-"},
      {l:"Disarm",t:"-unclicks & places red flag to normal position-"},
      {l:"── A220 (A220-100, A220-300) ── ARMING",t:"── A220 (A220-100, A220-300) ── ARMING"},
      {l:"Arm",t:"-removes key lock and stores away-"},
      {l:"Arm",t:"-pushes lock lever up-"},
      {l:"Arm",t:"-checks if green light appears to confirm door locked-"},
      {l:"── A220 (A220-100, A220-300) ── DISARMING",t:"── A220 (A220-100, A220-300) ── DISARMING"},
      {l:"Disarm",t:"-turns key lock on key hole-"},
      {l:"Disarm",t:"-pushes lock lever down-"},
      {l:"Disarm",t:"-checks if red light appears to confirm door unlocked-"},
      {l:"── A318 / A319 / A320 / A321neo ── ARMING",t:"── A318 / A319 / A320 / A321neo ── ARMING"},
      {l:"Arm",t:"-removes safety pin with red flag and stores away-"},
      {l:"Arm",t:"-pushes arming control lever down-"},
      {l:"Arm",t:"-ensures the indicator reads 'armed'-"},
      {l:"── A318 / A319 / A320 / A321neo ── DISARMING",t:"── A318 / A319 / A320 / A321neo ── DISARMING"},
      {l:"Disarm",t:"-lifts arming control lever fully up-"},
      {l:"Disarm",t:"-ensures the indicator reads 'disarmed'-"},
      {l:"Disarm",t:"-installs safety pin with the red flag-"},
      {l:"── B777 (777-300ER) ── ARMING",t:"── B777 (777-300ER) ── ARMING"},
      {l:"Arm",t:"-opens access cover, moves the mode selector to 'automatic' position-"},
      {l:"Arm",t:"-crouches onto floor towards door-"},
      {l:"Arm",t:"-checks the girt bar indicator flag viewing windows are yellow-"},
      {l:"── B777 (777-300ER) ── DISARMING",t:"── B777 (777-300ER) ── DISARMING"},
      {l:"Disarm",t:"-opens access cover, moves the mode selector to 'manual' position-"},
      {l:"Disarm",t:"-crouches onto floor towards door-"},
      {l:"Disarm",t:"-checks the girt bar indicator flag viewing windows are black-"},
      {l:"── B787 (787-9) ── ARMING",t:"── B787 (787-9) ── ARMING"},
      {l:"Arm",t:"-pulls safety lever-"},
      {l:"Arm",t:"-rotates arming control lever to the right-"},
      {l:"Arm",t:"-pulls down the door lock lever-"},
      {l:"── B787 (787-9) ── DISARMING",t:"── B787 (787-9) ── DISARMING"},
      {l:"Disarm",t:"-pulls up the door lock lever-"},
      {l:"Disarm",t:"-pulls safety lever-"},
      {l:"Disarm",t:"-rotates the arming control to the left-"},
      {l:"── A330-941neo / A350-900 ── ARMING",t:"── A330-941neo / A350-900 ── ARMING"},
      {l:"Arm",t:"-slides open protective cover-"},
      {l:"Arm",t:"-removes safety pin with red streamer-"},
      {l:"Arm",t:"-changes arming lever mode to 'armed'-"},
      {l:"Arm",t:"-closes protective cover-"},
      {l:"── A330-941neo / A350-900 ── DISARMING",t:"── A330-941neo / A350-900 ── DISARMING"},
      {l:"Disarm",t:"-slides open protective cover-"},
      {l:"Disarm",t:"-changes arming lever mode to 'disarmed'-"},
      {l:"Disarm",t:"-inserts safety pin with red streamer-"},
      {l:"Disarm",t:"-closes protective cover-"},
    ]
  },
  "🏷️ Naming Formats":{needsUser:false,dual:false,scripts:[
    {l:"Standard CC",t:"Firstname L. [-] Cabin Crew [-] [ENG]"},
    {l:"Senior CC",t:"Firstname L. [-] Senior Cabin Crew [-] [ENG]"},
    {l:"Destination Crew",t:"Firstname L. [-] Destination Crew [-] [ENG]"},
    {l:"Gate Agent",t:"Firstname L. [-] Gate Agent [-] [ENG]"},
    {l:"Lounge Attendant",t:"Firstname L. [-] Premium Lounge Attendant [-] [ENG]"},
    {l:"CSA",t:"Firstname L. [-] Customer Service Assistant [-] [ENG]"},
    {l:"Check-In Agent",t:"Firstname L. [-] Check-In Agent [-] [ENG]"},
  ]},
};

// sub-tabs in the order they happen in a flight
const CC_ORDER = ["🏷️ Naming Formats", "🎫 Upgrade Commands", "🛬 Boarding", "🍹 Pre-Flight Service", "🔒 Arming", "🍱 Cruising Setup", "🧣 Warm Towels", "✈️ Cruising Service", "🗑️ Trash & Clean-Up", "🔓 Disarming", "🛬 Deboarding", "📢 Notify Commands", "🛠️ Admin Commands"];
const CC_KEYS = CC_ORDER.filter(k => CC[k]).concat(Object.keys(CC).filter(k => CC_ORDER.indexOf(k) === -1));
let curCC = CC_KEYS[0];

function initCC() {
  const tabs = g('cc-tabs');
  tabs.innerHTML = CC_KEYS.map(tab =>
    `<button onclick="selCC('${tab.replace(/'/g,"\\'")}',this)">${tab}</button>`
  ).join('');
  tabs.children[0].classList.add('active');
  renderCC();
}

function selCC(tab, btn) {
  curCC = tab;
  document.querySelectorAll('#cc-tabs button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const data = CC[tab];
  g('ub-single').classList.toggle('show', data.needsUser && !data.dual);
  g('ub-dual').classList.toggle('show', data.dual);
  renderCC();
}

function subUser(text, greetOnly, serveOnly) {
  const greetU = (g('ub-greet-user').value||'').trim().toLowerCase() || 'user,user,user';
  const serveU = (g('ub-serve-user').value||'').trim().toLowerCase();
  const singleU = (g('ub-user').value||'').trim().toLowerCase();
  const u = serveU || singleU;
  const ccName = (g('cc-name')?.value||'').trim();
  const ccFlight = (g('cc-flight')?.value||'').trim();
  const ccDest = (g('cc-dest')?.value||'').trim();

  let t = text;
  // Replace multi-user pattern with greeting users
  t = t.replace(/(?<!\w)user(?:,user)+/gi, greetOnly ? greetU : (serveOnly ? '' : greetU));
  // Replace (user) with serving user
  t = t.replace(/\(user\)/gi, u||'(user)');
  t = t.replace(/\[USERNAME\]/gi, u||'[USERNAME]');
  t = t.replace(/\[USERS?\]/gi, u||'[USER]');
  if (ccName) t = t.replace(/\[NAME\]/gi, ccName);
  if (ccFlight) t = t.replace(/\[FLIGHT\]/gi, ccFlight);
  if (ccDest) t = t.replace(/\[DESTINATION\]/gi, ccDest);
  return t;
}


// ── Cabin Crew: route ID and aircraft fill the flight, destination and arming/disarming scripts ──
function ccPlaneFromAc(ac) {
  const map = [['A220','Airbus A220'],['A318','Airbus A318'],['A319','Airbus A319'],['A320','Airbus A320'],['A321','Airbus A321neo'],['A330','Airbus A330'],['A350','Airbus A350'],['737','Boeing 737-MAX8'],['777','Boeing 777-300ER'],['787','Boeing 787-9']];
  const hit = map.filter(t => ac && ac.indexOf(t[0]) !== -1)[0];
  return hit ? hit[1] : null;
}
function ccRoute() {
  const rid = (g('cc-route').value || '').replace(/\D/g, '');
  if (!rid) return;
  const f = routeFind(rid);
  if (!f) return;
  g('cc-flight').value = 'SPA' + rid;
  g('cc-dest').value = f.r.dest.replace(/\s*\[.*\]\s*$/, '');
  const pl = ccPlaneFromAc(f.r.ac);
  if (pl) g('cc-plane').value = pl;
  ccPlane();
  renderCC();
}
function ccPlane() {
  const pl = g('cc-plane').value;
  if (pl && g('br-plane')) { g('br-plane').value = pl; if (typeof brApplyScripts === 'function') brApplyScripts(); }
  renderCCArm();
  renderCC();
}
function renderCCArm() {
  const box = g('cc-arming');
  if (!box) return;
  box.innerHTML = '';
  return;
  const pl = g('cc-plane').value;
  const sc = pl && BR_SCRIPTS[pl];
  if (!sc) { box.innerHTML = pl ? '<div class="info-box">No arming scripts for ' + pl + ' yet.</div>' : ''; return; }
  const block = (l) => '<div class="s-block" onclick="cpText(this.dataset.t)" data-t="' + l.replace(/"/g, '&quot;') + '"><span class="copy-hint">click to copy</span><div class="s-text pf-cmd">' + l + '</div></div>';
  box.innerHTML = '<div class="s-section"><h3>Arming · ' + pl + '</h3>' + sc.arm.map(block).join('') + '</div>'
    + '<div class="s-section"><h3>Disarming · ' + pl + '</h3>' + sc.disarm.map(block).join('') + '</div>';
}
document.addEventListener('DOMContentLoaded', function () { if (g('cc-arming')) renderCCArm(); });
function renderCC() {
  const data = CC[curCC];
  let scripts = data.scripts;
  if (curCC === '🔒 Arming' || curCC === '🔓 Disarming') {
    const pl = g('cc-plane') ? g('cc-plane').value : '';
    const sc = pl && BR_SCRIPTS[pl];
    if (sc) scripts = (curCC === '🔓 Disarming' ? sc.disarm : sc.arm).map(t => ({ l: 'RP', t: t }));
  }
  g('cc-panels').innerHTML = scripts.map(s => {
    const display = subUser(s.t, s.greetOnly, s.serveOnly);
    const isRP = s.t.startsWith('-') && s.t.endsWith('-');
    const isCmd = s.t.startsWith(':') || s.t.startsWith('!');
    const fg = isRP ? '#5b9ec9' : isCmd ? '#0fa3b1' : '#e6edf3';
    return `<div class="s-block" onclick="cpText('${display.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')" style="margin-bottom:8px">
      <span class="copy-hint">click to copy</span>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <div class="s-text" style="color:${fg}">${display}</div>
        <span style="color:var(--sub);font-size:.72rem;white-space:nowrap;flex-shrink:0">${s.l}</span>
      </div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
//  COPY UTILITIES
// ═══════════════════════════════════════════════════════════════
let toastTmr;
function showToast() {
  g('toast').classList.add('show');
  clearTimeout(toastTmr);
  toastTmr = setTimeout(()=>g('toast').classList.remove('show'), 1800);
}
function cp(el) {
  const text = el.querySelector('.s-text').textContent;
  cpText(text);
  el.classList.add('copied');
  setTimeout(()=>el.classList.remove('copied'), 600);
}
function cpText(text) {
  navigator.clipboard.writeText(text).catch(()=>{
    const ta=document.createElement('textarea');
    ta.value=text;document.body.appendChild(ta);ta.select();
    document.execCommand('copy');ta.remove();
  });
  showToast();
}

// ═══════════════════════════════════════════════════════════════
//  DOWNLOAD
// ═══════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════
//  NAV
// ═══════════════════════════════════════════════════════════════
function showPage(p, btn) {
  if (typeof LOCKED !== 'undefined' && LOCKED[p]) { g('toast').textContent = 'Locked: requires the ' + LOCKED[p] + ' role'; showToast(); return; }
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.main-nav button').forEach(b=>b.classList.remove('active'));
  var pg = g('page-'+p);
  if (pg) pg.classList.add('active');
  btn.classList.add('active');
  if (p==='cc') renderCC();
  if (p==='greet') renderGreetings();
  if (p==='fleet') { setTimeout(renderFleet,0); }
  if (p==='flight') { setTimeout(update,0); }
  if (p==='suggest') renderSuggestGate();
}
function showRole(role, btn, cls) {
  document.querySelectorAll('.role-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.role-tabs button').forEach(b=>b.classList.remove('active','r-cpt','r-fo','r-so'));
  g('role-'+role).classList.add('active');
  btn.classList.add('active', cls);
  if (role === 'atc') setTimeout(buildATC, 50);
}

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
Object.keys(CHARTS).forEach(ap => {
  const opt=document.createElement('option');
  opt.value=ap; opt.textContent=ap;
  g('chart-ap-sel').appendChild(opt);
});

function showPFRole(role, btn) {
  document.querySelectorAll('.pf-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.pf-role-tabs button').forEach(b=>b.classList.remove('active'));
  document.getElementById('pf-'+role).classList.add('active');
  btn.classList.add('active');
}


function showSSRole(role, btn) {
  document.querySelectorAll('.ss-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.ss-role-tabs button').forEach(b=>b.classList.remove('active'));
  document.getElementById('ss-'+role).classList.add('active');
  btn.classList.add('active');
}


// GREETINGS
const GREETINGS = {
  "Lounge (Investor)": [
    {
      "l": "Full welcome",
      "t": "Hello and welcome to the Investor Lounge! My name is [NAME] and I'll be looking after you today. Please make yourself comfortable, and let me know if you need anything."
    },
    {
      "l": "Bar service",
      "t": "Hello and welcome to the Investor Lounge! My name is [NAME] and I'll be serving you today. May I offer you a drink or a warm towel?"
    },
    {
      "l": "Table service",
      "t": "Welcome! I'm [NAME] and I'll be looking after your table today. Can I get you a drink or a warm towel while you settle in?"
    },
    {
      "l": "Allergy check",
      "t": "Before I take your order, do you have any food allergies I should know about?"
    },
    {
      "l": "Order ready",
      "t": "Here is your order! Please let me know if there's anything else I can get for you."
    },
    {
      "l": "Farewell",
      "t": "I hope you enjoyed your time in the lounge! Boarding will start shortly, so please follow me to the gate when you're ready."
    }
  ],
  "Lounge (Premium)": [
    {
      "l": "Full welcome",
      "t": "Welcome to the Premium Lounge! I'm [NAME] and I'll be looking after you today. Please make yourself at home, and let me know if you need anything."
    },
    {
      "l": "Bar service",
      "t": "Hello and welcome to the Premium Lounge! My name is [NAME] and I'll be serving you today. May I offer you a drink or a warm towel?"
    },
    {
      "l": "Table service",
      "t": "Welcome! I'm [NAME] and I'll be looking after your table today. Can I get you a drink or a warm towel while you wait?"
    },
    {
      "l": "Allergy check",
      "t": "Before I take your order, do you have any food allergies I should know about?"
    },
    {
      "l": "Order ready",
      "t": "Here is your order! Please let me know if there's anything else I can get for you."
    }
  ],
  "Pre-Flight Service": [
    {
      "l": "Your greeting",
      "t": "Hello and welcome aboard! My name is [NAME] and I'll be serving you today. May I offer you a drink before we depart?"
    },
    {
      "l": "Standard PM",
      "t": "Welcome aboard! Before we set off, may I offer you a refreshing drink to start your journey?"
    },
    {
      "l": "Private flight PM",
      "t": "Welcome aboard this South Pacific Airways private flight! May I offer you a drink and a warm towel before we depart?"
    },
    {
      "l": "After serving",
      "t": "Enjoy!"
    }
  ],
  "Cruising Service": [
    {
      "l": "Your greeting",
      "t": "Hello and welcome! My name is [NAME] and I'll be your flight attendant today. Please take a look at our menu and let me know what you'd like. You can order up to 3 items."
    },
    {
      "l": "Standard PM",
      "t": "Hi, I'm [NAME], your flight attendant today. Would you like something to drink?"
    },
    {
      "l": "Stock note",
      "t": "Just so you know, we currently have Water and Orange Juice available."
    },
    {
      "l": "After serving",
      "t": "Enjoy!"
    },
    {
      "l": "No response follow-up",
      "t": "Hi, just checking in. Would you still like something to drink?"
    }
  ],
  "Warm Towels": [
    {
      "l": "Standard PM",
      "t": "Welcome! May I offer you a warm towel to freshen up before your meal service?"
    },
    {
      "l": "Private flight",
      "t": "Now that you're settled in, may I offer you a warm towel and a drink of your choice?"
    },
    {
      "l": "After giving",
      "t": "Here is your warm towel! Let me know if there's anything else I can get you."
    }
  ],
  "Boarding": [
    {
      "l": "Short",
      "t": "Welcome aboard!"
    },
    {
      "l": "Extended",
      "t": "Welcome aboard! Have a pleasant flight!"
    },
    {
      "l": "Formal",
      "t": "Good day, and welcome aboard! We are delighted to have you with us today."
    },
    {
      "l": "Private flight",
      "t": "Welcome aboard this South Pacific Airways private flight! On behalf of today's crew, we wish you a pleasant journey."
    }
  ],
  "Gate Agent": [
    {
      "l": "Opening greeting",
      "t": "Hello and welcome to the gate! My name is [NAME], what can I help you with?"
    },
    {
      "l": "Max amenities",
      "t": "I'm sorry, passengers can receive a maximum of 3 amenities. Is there anything else I can help you with?"
    },
    {
      "l": "Freecam offer",
      "t": "While you wait, would you like a freecam so you can look around?"
    }
  ],
  "Customer Service (CSA)": [
    {
      "l": "Standard greeting",
      "t": "Hello and welcome! My name is [NAME], your customer service assistant today. Is there anything I can help you with?"
    },
    {
      "l": "How to join staff",
      "t": "Great question! To join the South Pacific Airways team, join our Communications server on Discord and head to the #careers channel, where you'll find the open positions and application forms. We'd love to have you!"
    },
    {
      "l": "Upgrade info",
      "t": "Of course! Give me a moment and I'll sort that out once check-in opens for your class."
    },
    {
      "l": "Cannot help",
      "t": "I'm afraid that's outside what I can help with. Let me get someone who can assist you."
    }
  ],
  "Deboarding": [
    {
      "l": "Standard",
      "t": "Goodbye! Thank you for flying with South Pacific Airways!"
    },
    {
      "l": "Short",
      "t": "Farewell, and thank you for choosing SPA!"
    },
    {
      "l": "Warm",
      "t": "It was a pleasure having you on board. Safe travels, and we hope to see you again soon!"
    },
    {
      "l": "Private flight",
      "t": "Thank you for joining us on this South Pacific Airways private flight. We hope you enjoyed it, and we look forward to welcoming you back to [destination]!"
    }
  ],
  "Butler (Private Flight)": [
    {
      "l": "Entrance greeting",
      "t": "Hello and welcome! My name is [NAME] and I'll be with you throughout your private flight. May I walk you over to check-in?"
    },
    {
      "l": "Escort offer",
      "t": "Of course. Please allow me to escort you to the check-in desk. May I take your luggage?"
    },
    {
      "l": "No escort",
      "t": "No problem at all. Just let me know if you need any help checking in."
    },
    {
      "l": "Tour start",
      "t": "Now that you're checked in, may I show you our shops and lounges before we board?"
    },
    {
      "l": "Shop intro",
      "t": "This is [SHOP NAME], feel free to have a browse!"
    },
    {
      "l": "Lounge escort",
      "t": "I hope you enjoyed the tour! Follow me to the lounge, where you can relax before boarding."
    },
    {
      "l": "Gate escort",
      "t": "Boarding will begin shortly, so please follow me to the gate."
    }
  ],
  "Airport Police / Security": [
    {
      "l": "TSA scanner",
      "t": "Hello and welcome to [AIRPORT NAME]! My name is [NAME]. Please step through the scanner and wait for further instructions."
    },
    {
      "l": "Suspicious item",
      "t": "We've detected a suspicious item in your inventory. Please step aside for me."
    },
    {
      "l": "Gate boarding",
      "t": "Your flight is boarding at Gate [##] now. Please keep moving, thank you!"
    },
    {
      "l": "No ticket denial",
      "t": "I'm sorry, I can't let you through without a ticket. Please head to check-in and they'll help you."
    },
    {
      "l": "Line cutter warning",
      "t": "Excuse me, please return to the back of the queue. Cutting in line isn't permitted."
    },
    {
      "l": "PTA welcome",
      "t": "Hello! My name is [NAME], your transport agent today. Where would you like to be dropped off? Boarding starts at XX:11."
    },
    {
      "l": "PFO greeting",
      "t": "Hello! My name is [NAME], the security officer on this flight. Welcome on board, and please let me know if you need anything."
    },
    {
      "l": "Air Marshal to CC",
      "t": "Greetings, cabin crew. I'm your air marshal for this flight and will be monitoring it closely. Please contact me if you need any assistance."
    },
    {
      "l": "ID inspection opener",
      "t": "Good day. I'd like to run a quick inspection. I'll ask you a few questions and check your ID. Shall we begin?"
    },
    {
      "l": "Travel reason",
      "t": "What is the reason for your travel today?"
    },
    {
      "l": "Flown before",
      "t": "Have you flown with South Pacific Airways before?"
    },
    {
      "l": "Length of stay",
      "t": "How long are you planning to stay in [destination]?"
    },
    {
      "l": "Active chatter",
      "t": "Did you notice anything suspicious?"
    }
  ],
  "Paramedic": [
    {
      "l": "Initial approach",
      "t": "Hello, I'm [NAME], the paramedic on board today. You don't look too well. Are you alright? May I check on you for a moment?"
    },
    {
      "l": "Signs and symptoms",
      "t": "How are you feeling right now? Do you have any pain, dizziness, trouble breathing or nausea?"
    },
    {
      "l": "Allergies",
      "t": "Do you have any allergies to medication, food or anything else?"
    },
    {
      "l": "Medications",
      "t": "Are you currently taking any medication?"
    },
    {
      "l": "Past history",
      "t": "Do you have any previous medical conditions or surgeries?"
    },
    {
      "l": "Last oral intake",
      "t": "What did you last eat or drink, and when?"
    },
    {
      "l": "Events leading up",
      "t": "What were you doing when your [issue here] started?"
    },
    {
      "l": "HR check",
      "t": "Is your heart rate high, low or normal?"
    },
    {
      "l": "BP check",
      "t": "Is your blood pressure high, low or normal?"
    },
    {
      "l": "RR check",
      "t": "Are you breathing too fast, too slowly, or at a normal rate?"
    },
    {
      "l": "Temp check",
      "t": "Is your temperature too high or too low?"
    },
    {
      "l": "Unconscious check",
      "t": "Can you hear me?"
    },
    {
      "l": "Pain scale",
      "t": "On a scale of 0 to 10, how much pain are you in?"
    },
    {
      "l": "Blood test",
      "t": "Are there any abnormalities in the blood test?"
    },
    {
      "l": "Treatment done",
      "t": "All done! Let me know if anything changes or if you need me again."
    }
  ]
};

let curGreet = Object.keys(GREETINGS)[0];

function initGreetings() {
  var tabs = document.getElementById('greet-tabs');
  if (!tabs) return;
  tabs.innerHTML = Object.keys(GREETINGS).map(function(tab){
    return '<button data-tab="' + tab.replace(/"/g,'&quot;') + '" onclick="selGreetBtn(this)">' + tab + '</button>';
  }).join('');
  tabs.children[0].classList.add('active');
  curGreet = Object.keys(GREETINGS)[0];
  renderGreetings();
}

function selGreetBtn(btn) {
  selGreet(btn.getAttribute('data-tab'), btn);
}

function selGreet(tab, btn) {
  curGreet = tab;
  document.querySelectorAll('#greet-tabs button').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  renderGreetings();
}

function renderGreetings() {
  var el = document.getElementById('greet-panels');
  var hdr = document.getElementById('greet-cat-header');
  if (!el) return;
  var nm = ((document.getElementById('greet-name') || {}).value || 'Ziggy').trim() || 'Ziggy';
  var data = GREETINGS[curGreet] || [];
  if (hdr) hdr.textContent = curGreet;
  el.innerHTML = data.map(function(s) {
    var disp = s.t.replace(/\[NAME\]/g, nm);
    var isRP  = s.t[0]==='-' && s.t[s.t.length-1]==='-';
    var isCmd = s.t[0]===':';
    var cls   = isRP ? 'is-rp' : isCmd ? 'is-cmd' : '';
    var safe  = disp.replace(/\\/g,'\\\\').replace(/'/g,"\'");
    return '<div class="greet-card" onclick="greetCopy(this,\''+safe+'\')"><div class="greet-card-top"><span class="greet-card-label">'+s.l+'</span><span class="greet-copy-badge">✓ Copy</span></div><p class="greet-card-text '+cls+'">'+disp+'</p></div>';
  }).join('');
}

function greetCopy(card, text) {
  navigator.clipboard.writeText(text).catch(function(){
    var ta=document.createElement('textarea');ta.value=text;
    document.body.appendChild(ta);ta.select();
    document.execCommand('copy');ta.remove();
  });
  document.querySelectorAll('.greet-card.flash').forEach(function(c){c.classList.remove('flash');});
  card.classList.add('flash');
  setTimeout(function(){card.classList.remove('flash');},600);
  showToast();
}



// ROLES PAGE
function selectRoleTab(role, btn) {
  document.querySelectorAll('.roletab').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.roles-tab-btn').forEach(function(b){b.classList.remove('active');});
  var el = document.getElementById('roletab-'+role);
  if (el) el.classList.add('active');
  btn.classList.add('active');
}

function rcopy(el) {
  var textEl = el.querySelector('.rc-text');
  if (!textEl) return;
  var nm = ((document.getElementById('roles-name')||{}).value||'Ziggy').trim()||'Ziggy';
  var text = textEl.getAttribute('data-name') !== null
    ? textEl.textContent.replace(/\[NAME\]/g, nm)
    : textEl.textContent;
  navigator.clipboard.writeText(text).catch(function(){
    var ta=document.createElement('textarea');ta.value=text;
    document.body.appendChild(ta);ta.select();
    document.execCommand('copy');ta.remove();
  });
  document.querySelectorAll('.rc.flash').forEach(function(c){c.classList.remove('flash');});
  el.classList.add('flash');
  setTimeout(function(){el.classList.remove('flash');},500);
  showToast();
}


function selectMultiRoute(idx) {
  const num = g('inp-rid').value.trim();
  const id = 'SPA' + num;
  const matches = [];
  for (const [ap, data] of Object.entries(ROUTES)) {
    if (data.routes[id]) matches.push({ id, airport: ap, icao: data.icao, ...data.routes[id] });
  }
  if (matches[idx]) { curRoute = matches[idx]; update(); }
}


// ── PERSISTENCE ──────────────────────────────────────────────
function saveState() {
  try {
    const state = {
      name: g('inp-name')?.value || '',
      rid: g('inp-rid')?.value || '',
      ac: g('inp-ac')?.value || '',
      gate: g('inp-gate')?.value || '',
      rolesName: g('roles-name')?.value || '',
      greetName: g('greet-name')?.value || '',
      recent: getRecent(),
    };
    localStorage.setItem('spa_tool_state', JSON.stringify(state));
  } catch(e){}
}

function loadState() {
  try {
    const raw = localStorage.getItem('spa_tool_state');
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s.name && g('inp-name')) g('inp-name').value = s.name;
    if (s.rid && g('inp-rid')) g('inp-rid').value = s.rid;
    if (s.ac && g('inp-ac')) g('inp-ac').value = s.ac;
    if (s.gate && g('inp-gate')) g('inp-gate').value = s.gate;
    if (s.rolesName && g('roles-name')) g('roles-name').value = s.rolesName;
    if (s.greetName && g('greet-name')) { g('greet-name').value = s.greetName; }
    if (s.recent) setRecent(s.recent);
  } catch(e){}
}

// ── RECENT ROUTES ─────────────────────────────────────────────
let recentRoutes = [];
function getRecent() { return recentRoutes; }
function setRecent(r) { recentRoutes = r; renderRecent(); }

function addRecent(id) {
  recentRoutes = [id, ...recentRoutes.filter(r=>r!==id)].slice(0,5);
  renderRecent();
  saveState();
}

function renderRecent() {
  const el = g('recent-routes');
  if (!el) return;
  if (!recentRoutes.length) { el.style.display='none'; return; }
  el.style.display='block';
  el.innerHTML = '<span style="font-size:.7rem;color:var(--sub);text-transform:uppercase;letter-spacing:.06em;margin-right:8px">Recent:</span>' +
    recentRoutes.map(id => {
      const num = id.replace('SPA','');
      return '<button onclick="quickLoad(\'' + num + '\')" style="background:#0a1d36;border:1px solid #1a3456;color:#5b9ec9;padding:3px 10px;border-radius:12px;cursor:pointer;font-size:.78rem;margin-right:5px;transition:.15s" onmouseover="this.style.borderColor=\'#2196f3\'" onmouseout="this.style.borderColor=\'#1a3456\'">'+id+'</button>';
    }).join('');
}

function quickLoad(num) {
  g('inp-rid').value = num;
  update();
  g('inp-rid').focus();
}

// ── ROUTE SEARCH ──────────────────────────────────────────────
function searchRoutes() {
  const q = (g('route-search')?.value || '').toLowerCase().trim();
  const el = g('search-results');
  if (!el) return;
  if (!q) { el.style.display='none'; return; }
  
  const hits = [];
  for (const [ap, data] of Object.entries(ROUTES)) {
    for (const [sid, r] of Object.entries(data.routes)) {
      const dest = (typeof r === 'object' ? r.dest : r) || '';
      const ac = (typeof r === 'object' ? r.ac : '') || '';
      if (sid.toLowerCase().includes(q) || dest.toLowerCase().includes(q) || ap.toLowerCase().includes(q)) {
        hits.push({ sid, dest, ap, ac, icao: data.icao });
        if (hits.length >= 12) break;
      }
    }
    if (hits.length >= 12) break;
  }
  
  if (!hits.length) {
    el.innerHTML = '<div style="padding:12px 16px;color:var(--sub);font-size:.85rem">No routes found</div>';
    el.style.display = 'block';
    return;
  }
  
  el.innerHTML = hits.map(h => 
    '<div onclick="pickSearchRoute(\'' + h.sid.replace('SPA','') + '\')" style="padding:10px 16px;cursor:pointer;border-bottom:1px solid #1a3456;transition:.15s;display:flex;justify-content:space-between;align-items:center" onmouseover="this.style.background=\'#0f2540\'" onmouseout="this.style.background=\'\'">'
    + '<div><span style="color:#2196f3;font-weight:700">' + h.sid + '</span>'
    + ' <span style="color:#b8cfe8">' + h.ap + ' → ' + h.dest + '</span></div>'
    + '<span style="color:var(--sub);font-size:.72rem">' + acSuggestShort(h.ac) + '</span></div>'
  ).join('');
  el.style.display = 'block';
}

function acSuggestShort(cat) {
  const m = {'A318/A319':'A318/19','A220/A320/B737':'A220/320/737','A321neo':'A321neo',
    'B737MAX8':'B737 MAX','Widebody':'Widebody','A380/B747':'A380/747'};
  return m[cat]||cat||'';
}

function pickSearchRoute(num) {
  g('inp-rid').value = num;
  g('route-search').value = '';
  g('search-results').style.display = 'none';
  update();
}

// close search on outside click
document.addEventListener('click', function(e) {
  if (!e.target.closest('#route-search') && !e.target.closest('#search-results')) {
    const el = g('search-results');
    if (el) el.style.display = 'none';
  }
});


function copyAllSO() {
  const blocks = document.querySelectorAll('#so-scripts .s-text');
  const text = Array.from(blocks).map(b=>b.textContent).join(' | !wait 5 | ');
  cpText(text);
}





function filterFleet(filter, btn) {
  fleetFilter = filter;
  document.querySelectorAll('.fleet-filter-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  renderFleet();
}

// ── FLEET (static HTML) ──────────────────────────────────────
function fleetFilter(type, btn) {
  document.querySelectorAll('.fleet-filter-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('.frow').forEach(function(r){
    if (type === 'all') { r.style.display = ''; return; }
    if (type === 'airbus') { r.style.display = r.classList.contains('fairbus') ? '' : 'none'; return; }
    if (type === 'boeing') { r.style.display = r.classList.contains('fboeing') ? '' : 'none'; return; }
    r.style.display = r.classList.contains('f'+type) ? '' : 'none';
  });
}
function copyFleetRow(row, name) {
  cpText(name);
  var orig = row.style.background;
  row.style.background = '#071a0e';
  row.style.transition = 'none';
  setTimeout(function(){ row.style.background = orig; row.style.transition = 'background .15s'; }, 500);
}
// ── GROUND CREW ──────────────────────────────────────────────
function selGC(tab, btn) {
  document.querySelectorAll('#page-gc .roletab').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('#page-gc .roles-tab-btn').forEach(function(b){ b.classList.remove('active'); });
  var el = document.getElementById('gc-' + tab);
  if (el) el.classList.add('active');
  btn.classList.add('active');
}

// ── ATC ──────────────────────────────────────────────────────
function atcV(id, fallback) {
  var el = document.getElementById(id);
  return (el && el.value && el.value.trim()) ? el.value.trim() : fallback;
}

function buildATC() {
  var el = document.getElementById('atc-scripts');
  if (!el) return;
  var R    = 'SPA' + atcV('atc-rid', '???');
  var DEP  = atcV('atc-dep', 'DEP');
  var DEST = atcV('atc-dest', 'DEST');
  var GATE = atcV('atc-gate', '??');
  var RWY  = atcV('atc-rwy', '??');
  var VAC  = atcV('atc-vac', '??');
  var PUSH = atcV('atc-push', 'left');
  var TAXI = atcV('atc-taxi', '??');

  var sections = [
    ['Ground Crew — When Parked', [
      ['gc', ':scriptchat gc [GC] '+R+', Ground Crew, confirm communications test is successful.'],
      ['fd', ':scriptchat fd [FD] Ground Crew, communications test is successful.'],
      ['gc', ':scriptchat gc [GC] '+R+', Ground Crew, confirm parking brake is set.'],
      ['fd', ':scriptchat fd [FD] Ground Crew, parking brake confirmed to be set.'],
      ['gc', ':scriptchat gc [GC] '+R+', Ground Crew, confirm clearance to attach ground vehicles.'],
      ['fd', ':scriptchat fd [FD] Ground Crew, clear to attach all necessary ground vehicles.']
    ]],
    ['Ground Crew — Before Detach', [
      ['gc', ':scriptchat gc [GC] '+R+', Ground Crew, confirm clearance to detach all ground vehicles.'],
      ['fd', ':scriptchat fd [FD] Ground Crew, clear to detach ground vehicles.']
    ]],
    ['IFR Clearance (XX:50-XX:10)', [
      ['fd', ':scriptchat fd [FD] '+DEP+' clearance, '+R+' at gate '+GATE+', requesting IFR clearance to '+DEST+'.'],
      ['atc', ':scriptchat atc [ATC] '+R+' IFR clearance to '+DEST+' approved, using the departure SID then as filed, expect flight level 350, 10 minutes after departure and expect runway '+RWY+', contact ground when ready to push.'],
      ['fd', ':scriptchat fd [FD] Cleared to '+DEST+' via the departure SID then as filed going to flight level 350, 10 minutes after departure. contact ground when ready to push, thanks.']
    ]],
    ['Pushback', [
      ['fd', ':scriptchat fd [FD] '+DEP+' ground, '+R+' with current, request push and start.'],
      ['atc', ':scriptchat atc [ATC] '+R+' push and start approved, push tail '+PUSH+'.'],
      ['fd', ':scriptchat fd [FD] Pushing back tail to the '+PUSH+', '+R+'.']
    ]],
    ['Taxi', [
      ['fd', ':scriptchat fd [FD] '+DEP+' Ground '+R+' on [TAXIWAY], ready for taxi.'],
      ['atc', ':scriptchat atc [ATC] '+R+' taxi to active, runway '+RWY+' via, [TAXI ROUTE].'],
      ['fd', ':scriptchat fd [FD] Taxi to active, runway '+RWY+' via [TAXI ROUTE]. '+R+'.']
    ]],
    ['Holding Short / Line Up', [
      ['atc', ':scriptchat atc [ATC] '+R+' monitor the frequency.'],
      ['fd', ':scriptchat fd [FD] Monitor the frequency '+R+'.'],
      ['atc', ':scriptchat atc [ATC] '+R+', runway '+RWY+' cleared for takeoff.'],
      ['fd', ':scriptchat fd [FD] Runway '+RWY+' cleared for takeoff '+R+'.']
    ]],
    ['Shortly After Takeoff', [
      ['atc', ':scriptchat atc [ATC] '+R+' contact departure.'],
      ['fd', ':scriptchat fd [FD] Over to departure '+R+', Gday.'],
      ['fd', ':scriptchat fd [FD] '+DEP+' departure, '+R+' is with you flying on route as filed.'],
      ['atc', ':scriptchat atc [ATC] Roger, '+R+' cleared to flight level 350, continue route as filed.'],
      ['fd', ':scriptchat fd [FD] Cleared up to flight level 350.']
    ]],
    ['During Cruise', [
      ['atc', ':scriptchat atc [ATC] '+R+' frequency change to destination center approved. Gday.'],
      ['fd', ':scriptchat fd [FD] Over to arrival center.'],
      ['fd', ':scriptchat fd [FD] Good morning center, '+R+' with you at Flight Level 350.'],
      ['atc', ':scriptchat atc [ATC] Copy, welcome '+R+'.']
    ]],
    ['Before Descent', [
      ['fd', ':scriptchat fd [FD] '+R+' requesting permission to descend to flight level 200.'],
      ['atc', ':scriptchat atc [ATC] '+R+' cleared to descend to flight level 200, continue route as filed.'],
      ['atc', ':scriptchat atc [ATC] '+R+' change frequency over to arrival.'],
      ['fd', ':scriptchat fd [FD] Changing frequency to arrival, '+R+'.']
    ]],
    ['During Descent', [
      ['fd', ':scriptchat fd [FD] '+DEST+' arrival '+R+' with current for arrival into '+DEST+'.'],
      ['atc', ':scriptchat atc [ATC] '+R+' welcome, keep your own navigation expect the ILS for runway '+RWY+'.'],
      ['fd', ':scriptchat fd [FD] Continuing with our own navigation, '+R+'.']
    ]],
    ['On Approach', [
      ['atc', ':scriptchat atc [ATC] '+R+' Over to Tower.'],
      ['fd', ':scriptchat fd [FD] Contacting tower '+R+'.'],
      ['fd', ':scriptchat fd [FD] Tower '+R+' on approach to runway '+RWY+'.'],
      ['atc', ':scriptchat atc [ATC] '+R+' runway '+RWY+' cleared to land.'],
      ['fd', ':scriptchat fd [FD] Cleared to land runway '+RWY+', '+R+'.']
    ]],
    ['After Landing', [
      ['atc', ':scriptchat atc [ATC] '+R+' contact ground, and welcome.'],
      ['fd', ':scriptchat fd [FD] Over to ground '+R+', thanks.'],
      ['fd', ':scriptchat fd [FD] Ground '+R+' off runway '+RWY+' on '+VAC+', request taxi to the ramp.'],
      ['atc', ':scriptchat atc [ATC] '+R+' taxi to the ramp, via '+TAXI+'.'],
      ['fd', ':scriptchat fd [FD] To the ramp, via '+TAXI+', for '+R+'.']
    ]],
    ['Holding Pattern (if needed)', [
      ['atc', ':scriptchat atc [ATC] '+R+' maintain right holding pattern.'],
      ['fd', ':scriptchat fd [FD] Roger maintaining right holding pattern '+R+'.'],
      ['atc', ':scriptchat atc [ATC] '+R+' break holding pattern continue as filed.'],
      ['fd', ':scriptchat fd [FD] Roger breaking holding pattern, continue as filed.']
    ]],
    ['Go Around - FD Initiated', [
      ['fd', ':scriptchat fd [FD] Going around runway '+RWY+' '+R+'.'],
      ['atc', ':scriptchat atc [ATC] Roger climb and maintain FL050 off to the right switch over to arrivals.'],
      ['fd', ':scriptchat fd [FD] Climb and maintain FL050 over to arrivals.'],
      ['fd', ':scriptchat fd [FD] '+R+' climbing FL050 for re-approach runway '+RWY+'.'],
      ['atc', ':scriptchat atc [ATC] Roger, clear to re-approach runway '+RWY+' '+R+'.'],
      ['fd', ':scriptchat fd [FD] Cleared to re-approach runway '+RWY+' '+R+'.'],
      ['atc', ':scriptchat atc [ATC] '+R+' Over to Tower.'],
      ['fd', ':scriptchat fd [FD] Over to tower '+R+'.'],
      ['fd', ':scriptchat fd [FD] Tower '+R+' back on approach, runway '+RWY+'.'],
      ['atc', ':scriptchat atc [ATC] '+R+' runway '+RWY+' cleared to land.'],
      ['fd', ':scriptchat fd [FD] Cleared to land runway '+RWY+', '+R+'.']
    ]],
    ['Go Around - ATC Initiated', [
      ['atc', ':scriptchat atc [ATC] '+R+' Go Around.'],
      ['fd', ':scriptchat fd [FD] Going Around '+R+'.'],
      ['atc', ':scriptchat atc [ATC] '+R+' climb and maintain FL050, over to arrivals.'],
      ['fd', ':scriptchat fd [FD] Climb and maintain FL050 over to arrivals, for '+R+'.'],
      ['fd', ':scriptchat fd [FD] '+R+' climbing FL050 for re-approach runway '+RWY+'.'],
      ['atc', ':scriptchat atc [ATC] Roger, clear to re-approach runway '+RWY+' '+R+'.'],
      ['fd', ':scriptchat fd [FD] Cleared to re-approach runway '+RWY+' '+R+'.'],
      ['atc', ':scriptchat atc [ATC] '+R+' Over to Tower.'],
      ['fd', ':scriptchat fd [FD] Over to tower '+R+'.'],
      ['fd', ':scriptchat fd [FD] Tower '+R+' back on approach, runway '+RWY+'.'],
      ['atc', ':scriptchat atc [ATC] '+R+' runway '+RWY+' cleared to land.'],
      ['fd', ':scriptchat fd [FD] Cleared to land runway '+RWY+', '+R+'.']
    ]]
  ];

  var badgeColor  = {gc:'#e3a008', fd:'#1db954', atc:'#2196f3'};
  var bgColor     = {gc:'rgba(227,160,8,.08)', fd:'rgba(29,185,84,.08)', atc:'rgba(33,150,243,.08)'};
  var borderColor = {gc:'rgba(227,160,8,.25)', fd:'rgba(29,185,84,.25)', atc:'rgba(33,150,243,.25)'};

  window._atcScripts = {};
  var out = '';
  var idx = 0;

  for (var s = 0; s < sections.length; s++) {
    var title = sections[s][0];
    var rows  = sections[s][1];
    out += '<div style="margin-bottom:20px">'
      + '<div style="font-size:.68rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#2196f3;padding-bottom:8px;border-bottom:1px solid #1a3456;margin-bottom:10px">'
      + title + '</div>';
    for (var r = 0; r < rows.length; r++) {
      var type  = rows[r][0];
      var text  = rows[r][1];
      var bc = badgeColor[type]  || '#5b8ab0';
      var bg = bgColor[type]     || 'rgba(91,138,176,.08)';
      var bd = borderColor[type] || 'rgba(91,138,176,.2)';
      var lbl = type === 'gc' ? 'GC' : type === 'fd' ? 'FD' : 'ATC';
      var key = 'ak' + idx++;
      window._atcScripts[key] = text;
      out += '<div data-ak="'+key+'" onclick="copyAtcScript(this)"'
        + ' style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;background:'+bg+';border:1px solid '+bd+';border-radius:9px;margin-bottom:6px;cursor:pointer;transition:.15s"'
        + ' onmouseover="this.style.filter=\'brightness(1.15)\'" onmouseout="this.style.filter=\'\'">'
        + '<span style="background:'+bc+';color:#000;font-size:.65rem;font-weight:800;padding:2px 7px;border-radius:6px;margin-top:2px;flex-shrink:0">'+lbl+'</span>'
        + '<span style="font-size:.83rem;color:#b8cfe8;line-height:1.5;font-family:Consolas,monospace">'+text+'</span>'
        + '</div>';
    }
    out += '</div>';
  }
  el.innerHTML = out;
}

function copyAtcScript(el) {
  var key  = el.getAttribute('data-ak');
  var text = window._atcScripts && window._atcScripts[key] ? window._atcScripts[key] : '';
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(function(){});
  } else {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  el.style.filter = 'brightness(1.5)';
  setTimeout(function(){ el.style.filter = ''; }, 400);
}


// ── CC REFERENCE ─────────────────────────────────────────────
function selCCTop(tab, btn) {
  document.querySelectorAll('#page-cc .cc-top-panel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('#page-cc .roles-tab-btn').forEach(function(b){ b.classList.remove('active'); });
  var el = document.getElementById('cctop-' + tab);
  if (el) el.classList.add('active');
  btn.classList.add('active');
}


// ── CO-HOST ───────────────────────────────────────────────────
function selCH(tab, btn) {
  document.querySelectorAll('#page-cohost .roletab').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('#page-cohost .roles-tab-btn').forEach(function(b){ b.classList.remove('active'); });
  var el = document.getElementById('ch-' + tab);
  if (el) el.classList.add('active');
  btn.classList.add('active');
}

// ── LOCAL SAVE: every input/select is saved in this browser and restored on load ──
const SAVE_KEY = 'spa_tool_inputs_v1';
const SAVE_SKIP = ['route-search'];
function saveInputs() {
  try {
    const data = {};
    document.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
      if (SAVE_SKIP.includes(el.id) || el.type === 'checkbox' || el.type === 'button') return;
      data[el.id] = el.value;
    });
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {}
}
function restoreInputs() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.keys(data).forEach(id => {
      const el = document.getElementById(id);
      if (el && data[id] !== '') el.value = data[id];
    });
  } catch (e) {}
}
document.addEventListener('input', saveInputs);
document.addEventListener('change', saveInputs);


// ── SUGGESTIONS (anonymous; stored in a Google Form + Sheet) ──
// Fill these in once. Leave blank and the tab just says "Not connected yet".
const SUGGEST_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfuewPrBh6Us-TbuJHvaARMtOHrtWbqzd04HJs6doho7DShaw/formResponse';  // formResponse link, e.g. https://docs.google.com/forms/d/e/XXXX/formResponse
const SUGGEST_FIELD_ID = 'entry.138929201';  // the entry ID for the question, e.g. entry.123456789
const SUGGEST_NAME_FIELD_ID = 'entry.955504930';  // Discord username question
const SUGGEST_CSV_URL  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSpo4f8tfAN2oWh46n527ov4iBGsGf0MH9uamaZ070uyeA2vtOr-8lk7AeTlKZKl_zEfTf6DZ6YzGdJ/pub?output=csv';  // the sheet published as CSV, e.g. https://docs.google.com/spreadsheets/d/e/XXXX/pub?output=csv

function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i+1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i+1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}

function getSuggestAnon() { return localStorage.getItem('spa_suggest_anon') !== 'off'; }
function toggleSuggestAnon() {
  localStorage.setItem('spa_suggest_anon', getSuggestAnon() ? 'off' : 'on');
  renderSuggestAnon();
}
function renderSuggestAnon() {
  const b = g('suggest-anon-btn');
  if (!b) return;
  const on = getSuggestAnon();
  b.textContent = on ? 'Anonymous: On' : 'Anonymous: Off';
  b.classList.toggle('active', on);
  const sb = g('suggest-send-btn');
  if (sb) sb.textContent = on ? 'Send anonymously' : 'Send';
}
async function fetchDiscordName(token) {
  try {
    const r = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: 'Bearer ' + token } });
    if (!r.ok) return;
    const u = await r.json();
    localStorage.setItem('spa_discord_name', u.username || '');
    localStorage.setItem('spa_discord_id', u.id || '');
  } catch (e) {}
}

async function loadSuggestions() {
  // Suggestions are not shown in the tool. Staff read them in the Google Sheet.
  return;
  if (!SUGGEST_CSV_URL) { msg.textContent = 'Not connected yet.'; list.innerHTML = ''; return; }
  msg.textContent = 'Loading…';
  try {
    const res = await fetch(SUGGEST_CSV_URL, { cache: 'no-store' });
    const rows = parseCSV(await res.text());
    if (rows.length < 2) { msg.textContent = 'No suggestions yet.'; list.innerHTML = ''; return; }
    let col = rows[0].findIndex(h => h.trim().toLowerCase() !== 'timestamp');
    if (col < 0) col = 0;
    const items = rows.slice(1).map(r => r[col] || '').filter(t => t.trim()).reverse();
    msg.textContent = items.length + ' suggestion' + (items.length === 1 ? '' : 's');
    list.innerHTML = '';
    items.forEach(t => {
      const d = document.createElement('div'); d.className = 'rc';
      const x = document.createElement('div'); x.className = 'rc-text';
      x.textContent = t; d.appendChild(x); list.appendChild(d);
    });
  } catch (e) {
    msg.textContent = 'Could not load suggestions. Check the sheet link.';
  }
}

async function submitSuggestion() {
  const box = g('suggest-input'), msg = g('suggest-status');
  const text = box.value.trim();
  if (!text) { msg.style.color = 'var(--red)'; msg.textContent = 'Write something first.'; return; }
  if (!SUGGEST_FORM_URL || !SUGGEST_FIELD_ID) { msg.textContent = 'Not connected yet.'; return; }
  const body = new URLSearchParams();
  body.append(SUGGEST_FIELD_ID, text);
  if (!getSuggestAnon()) {
    const name = localStorage.getItem('spa_discord_name');
    if (!SUGGEST_NAME_FIELD_ID) { msg.style.color = 'var(--red)'; msg.textContent = 'Non-anonymous sending is not set up yet.'; return; }
    if (!name) { msg.style.color = 'var(--red)'; msg.textContent = 'Log out and back in to send with your Discord name.'; return; }
    body.append(SUGGEST_NAME_FIELD_ID, name);
  }
  try {
    await fetch(SUGGEST_FORM_URL, { method: 'POST', mode: 'no-cors', body });
    box.value = '';
    msg.style.color = 'var(--green)'; msg.textContent = 'Success! Your suggestion was sent anonymously.';
    setTimeout(loadSuggestions, 3000);
  } catch (e) {
    msg.style.color = 'var(--red)'; msg.textContent = 'Could not send. Try again.';
  }
}

// ── DISCORD LOGIN (required to use the tool; stays signed in on this device until it expires or you sign out) ──
const DISCORD_CLIENT_ID  = '1559916673459421305';
const DISCORD_GUILD_ID   = '709581352768634920';
const DISCORD_REDIRECT   = 'https://ziggyerest.github.io/ziggys_spatools/index.html';
const DISCORD_TOKEN_KEY  = 'spa_discord_token';
const DISCORD_EXPIRY_KEY = 'spa_discord_expires';
const DISCORD_VISITS_KEY = 'spa_discord_visits';
const DISCORD_LOGIN_EVERY = 25;  // log in again on every 25th visit

function discordLoginURL() {
  const q = new URLSearchParams({ client_id: DISCORD_CLIENT_ID, redirect_uri: DISCORD_REDIRECT, response_type: 'token', scope: 'identify guilds guilds.members.read' });
  return 'https://discord.com/oauth2/authorize?' + q.toString();
}
// Saves the token when Discord sends the browser back here. Returns true if it did.
function captureDiscordToken() {
  // Supabase login returns the Discord token as provider_token; leave the address alone so Supabase can read it
  if (/provider_token=/.test(location.hash)) return false;  // Supabase admin login, not the tool login
  const m = location.hash.match(/access_token=([^&]+)/);
  if (!m) return false;
  const ex = location.hash.match(/expires_in=(\d+)/);
  const seconds = ex ? parseInt(ex[1], 10) : 604800;
  localStorage.setItem(DISCORD_TOKEN_KEY, m[1]);
  localStorage.setItem(DISCORD_EXPIRY_KEY, String(Date.now() + seconds * 1000));
  localStorage.setItem(DISCORD_VISITS_KEY, '0');
  history.replaceState(null, '', location.pathname + location.search);
  return true;
}
function getDiscordToken() {
  const t = localStorage.getItem(DISCORD_TOKEN_KEY);
  const exp = parseInt(localStorage.getItem(DISCORD_EXPIRY_KEY) || '0', 10);
  if (!t || Date.now() > exp) { clearDiscordToken(); return null; }
  return t;
}
function clearDiscordToken() {
  localStorage.removeItem('spa_discord_name');
  localStorage.removeItem(DISCORD_TOKEN_KEY);
  localStorage.removeItem(DISCORD_EXPIRY_KEY);
}
async function checkDiscordAccess() {
  const token = getDiscordToken();
  if (!token) return false;
  try {
    const r = await fetch('https://discord.com/api/users/@me/guilds/' + DISCORD_GUILD_ID + '/member', { headers: { Authorization: 'Bearer ' + token } });
    if (r.status === 401) { clearDiscordToken(); return false; }
    if (!r.ok) return false;   // 404 = not in the server, 403 = log in again to approve roles
    const m = await r.json();
    localStorage.setItem('spa_discord_roles', JSON.stringify(m.roles || []));
    return true;
  } catch (e) { return false; }
}
function discordSignOut() {
  clearDiscordToken();
  location.reload();
}
function setAuthVisible(show) {
  const a = g('auth-gate');
  if (a) a.style.display = show ? 'flex' : 'none';
}
async function enforceLogin() {
  const msg = g('auth-msg'), btn = g('auth-login');
  if (!msg || !btn) return;
  if (!DISCORD_CLIENT_ID) { msg.textContent = 'Discord login is not set up yet.'; btn.style.display = 'none'; setAuthVisible(true); return; }
  if (getDiscordToken()) {
    const v = parseInt(localStorage.getItem(DISCORD_VISITS_KEY) || '0', 10);
    if (v >= DISCORD_LOGIN_EVERY) { clearDiscordToken(); localStorage.removeItem(DISCORD_VISITS_KEY); }
    else localStorage.setItem(DISCORD_VISITS_KEY, String(v + 1));
  }
  if (!getDiscordToken()) {
    msg.textContent = 'Log in with Discord to use the tool. Your account is never shown to other users.';
    btn.style.display = ''; setAuthVisible(true); return;
  }
  msg.textContent = 'Checking access…'; btn.style.display = 'none'; setAuthVisible(true);
  const ok = await checkDiscordAccess();
  if (ok) { await fetchDiscordName(getDiscordToken()); await recordLogin(); await loadMyAccess(); applyRoleLocks(); applyBriefingLocks(); setAuthVisible(false); }
  else {
    msg.textContent = 'Could not confirm access. Make sure you are in the SPA server, then log in again to approve your roles.';
    btn.style.display = ''; btn.textContent = 'Log in with Discord';
  }
}
function renderSuggestGate() {
  const gate = g('suggest-gate'), main = g('suggest-main');
  if (gate) gate.style.display = 'none';
  if (main) main.style.display = '';
  renderSuggestAnon();
  loadSuggestions();
}

// ── ROLE ACCESS (locks tabs the person does not have a role for) ──
var ROLE_GATES = [
  { page: 'flight', label: 'Flight Deck',       ids: ['1194355051804754041', '1194303022692569098', '1297002701443305533'] },
  { page: 'ss',     label: 'Safety & Security', ids: ['1194303260719337599'] },
  { page: 'cc',     label: 'Cabin Crew',        ids: ['1194303157388451950'] },
  { page: 'cohost', label: 'Co-Host',           ids: ['1194302914060107796'] }
];
// Ground Crew role IDs (no Ground Crew tab right now): 1241528593385783318, 1290004653404328048
var LOCKED = {};
var ALL_ACCESS_IDS = ['1327108083281035325'];
function applyRoleLocks() {
  var bypass = ALL_ACCESS_IDS.indexOf(localStorage.getItem('spa_discord_id')) !== -1;
  var roles = [];
  try { roles = JSON.parse(localStorage.getItem('spa_discord_roles') || '[]'); } catch (e) {}
  ROLE_GATES.forEach(function (gt) {
    var ok = bypass || gt.ids.some(function (id) { return roles.indexOf(id) !== -1; });
    LOCKED[gt.page] = ok ? null : gt.label;
  });
  PERM_TABS.forEach(function (t) {
    var denied = PERM_ACCESS && !bypass && PERM_ACCESS.indexOf(t[0]) === -1;
    if (denied) LOCKED[t[0]] = LOCKED[t[0]] || t[1];
    else if (!ROLE_GATES.some(function (gt) { return gt.page === t[0]; })) LOCKED[t[0]] = null;
  });
  var buttons = [].slice.call(document.querySelectorAll('.main-nav button'));
  buttons.forEach(function (b) {
    var m = (b.getAttribute('onclick') || '').match(/showPage\('(\w+)'/);
    if (!m) return;
    var lock = LOCKED[m[1]];
    b.classList.toggle('locked', !!lock);
    b.title = lock ? 'Locked: requires the ' + lock + ' role' : '';
    // tabs the access list does not include are removed from view completely
    var permDenied = PERM_ACCESS && !bypass && PERM_TABS.some(function (t) { return t[0] === m[1]; }) && PERM_ACCESS.indexOf(m[1]) === -1;
    if (!b.hasAttribute('data-admin-only')) b.style.display = permDenied ? 'none' : '';
  });
  var active = document.querySelector('.main-nav button.active');
  var am = active && (active.getAttribute('onclick') || '').match(/showPage\('(\w+)'/);
  if (am && LOCKED[am[1]]) {
    var first = buttons.filter(function (b) {
      var mm = (b.getAttribute('onclick') || '').match(/showPage\('(\w+)'/);
      return mm && !LOCKED[mm[1]];
    })[0];
    if (first) first.click();
  }
}

// ── CO-HOST QOL: search + remember last sub-tab ──
function chSearch(q) {
  var pg = document.getElementById('page-cohost');
  if (!pg) return;
  q = (q || '').trim().toLowerCase();
  var tabs = pg.querySelector('.roles-tab-row');
  var panels = [].slice.call(pg.querySelectorAll('.roletab'));
  if (!q) {
    panels.forEach(function (p) {
      p.style.display = '';
      p.querySelectorAll('.rc, .s-block').forEach(function (c) { c.style.display = ''; });
    });
    if (tabs) tabs.style.display = '';
    return;
  }
  if (tabs) tabs.style.display = 'none';
  panels.forEach(function (p) {
    var hits = 0;
    p.querySelectorAll('.rc, .s-block').forEach(function (c) {
      var match = c.textContent.toLowerCase().indexOf(q) !== -1;
      c.style.display = match ? '' : 'none';
      if (match) hits++;
    });
    p.style.display = hits ? 'block' : 'none';
  });
}
var _selCH_orig = selCH;
selCH = function (name, btn) {
  localStorage.setItem('spa_ch_tab', name);
  return _selCH_orig(name, btn);
};
var _showPage_orig = showPage;
showPage = function (p, btn) {
  var r = _showPage_orig(p, btn);
  if (p === 'cohost') chRestoreTab();
  return r;
};
function chRestoreTab() {
  var n = localStorage.getItem('spa_ch_tab');
  if (!n || n === 'general') return;
  var b = document.querySelector('#page-cohost .roles-tab-row button[onclick*="selCH(\'' + n + '\'"]');
  if (b) b.click();
}

// ── COPY ALL GENERAL TRIVIA (10s after a question, 5s after an answer) ──
function copyGeneralTrivia(btn) {
  var panel = document.getElementById('ch-trivia');
  if (!panel) return;
  var on = false, parts = [];
  [].slice.call(panel.querySelectorAll('.rs-title, .rc')).forEach(function (el) {
    if (el.classList.contains('rs-title')) { on = el.textContent.indexOf('General Trivia') !== -1; return; }
    if (!on) return;
    var label = (el.querySelector('.rc-label') || {}).textContent || '';
    var text = (el.querySelector('.rc-text') || {}).textContent || '';
    if (!text.trim()) return;
    parts.push(text.trim());
    parts.push(/^Q\d+/.test(label.trim()) ? '!wait 10' : '!wait 5');
  });
  if (parts.length && parts[parts.length - 1].indexOf('!wait') === 0) parts.pop();
  cpText(parts.join(' | '));
  var old = btn.textContent;
  btn.textContent = '✓ Copied!';
  setTimeout(function () { btn.textContent = old; }, 1500);
}

// ── BRIEFING SHEETS ──
var BR_WIDE = ['Airbus A330', 'Airbus A350', 'Boeing 777-300ER', 'Boeing 787-9'];
function selBRAuto(name, btn) {
  if (BR_LOCKED[name]) { g('toast').textContent = 'Locked: requires the ' + BR_LOCKED[name] + ' role'; showToast(); return; }
  document.querySelectorAll('#br-auto-row button').forEach(function (b) { b.classList.toggle('active', b === btn); });
  document.getElementById('br-cc').style.display = name === 'cc' ? '' : 'none';
  document.getElementById('br-sec').style.display = name === 'sec' ? '' : 'none';
  brRender();
}
function brFlight() { var r = (g('br-route').value || '').trim(); return r ? 'SPA' + r : 'SPA[ROUTE]'; }
function brHost() { return (g('br-host').value || '').trim() || '[USERNAME]'; }
function brQuote(text, fallback) {
  var lines = (text || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
  return lines.length ? lines.map(function (l) { return '> ' + l; }).join('\n') : fallback;
}
function brCount(n, fmt) {
  var out = [];
  for (var i = 1; i <= n; i++) out.push(fmt(i));
  return out.length ? out.join('\n') : '> ' + '[none yet]';
}
function brRender() {
  var ccOut = g('br-cc-out'), secOut = g('br-sec-out');
  if (ccOut) ccOut.value = brCCOut();
  if (secOut) secOut.value = brSecOut();
}
function brSecOut() {
  var n = parseInt(g('br-sy').value, 10) || 0;
  var roles = brQuote(g('br-sec-roles').value, brCount(n, function (i) { return '> @user • *Role* → *Roles*'; }));
  return [
    '**<:SPASecurityAgent:1092230147131846676> | Safety & Security Briefing Sheet**',
    '*For flight ' + brFlight() + ', hosted by ' + brHost() + '*',
    '',
    '-# All allocated Safety & Security members have been assigned roles by their Security Sergeant, which can be found below; please follow these roles unless instructed otherwise. Be respectful, professional, and listen to your Security Sergeant at all times.',
    '',
    '<:SPAAirportPatrol:1092229929950781451> **Role Assignments**',
    roles,
    '',
    '*If you have any questions, do not hesitate to ask me (your Sergeant).*',
    '',
    '*Signed, <@1327108083281035325>*',
    '<:SPA:795664970800824360> **south**pacific.'
  ].join('\n');
}
function brCCOut() {
  var plane = g('br-plane').value;
  var wide = BR_WIDE.indexOf(plane) !== -1 ? 'Widebody' : 'Narrowbody';
  var n = parseInt(g('br-cc-count').value, 10) || 0;
  var airport = brQuote(g('br-cc-airport').value, brCount(n, function (i) { return '> @CC' + i + ' | [Role]'; }));
  var onboard = brQuote(g('br-cc-onboard').value, brCount(n, function (i) { return '> @CC' + i + ' | [Insert roles]'; }));
  return [
    '<:SPACabinCrew:925881098762866698> | **Cabin Crew Briefing Sheet**',
    '> *Greetings, Cabin Crew! Your briefing sheet for this flight has been posted. Your arming & disarming scripts have also been provided in addition to your assigned roles.*',
    '> ',
    '> *Please pay close attention to your assigned roles, so we can facilitate a smooth flight for everyone. If you\'re not assigned an on-board role, remain at your airport role until boarding is completed.*',
    '',
    '<:SPAOperations:1028766648389349526> | **Flight Details**',
    '> *Flight Host: ' + brHost() + '*',
    '> *Callsign: ' + brFlight() + '*',
    '> *Aircraft: ' + plane + ' | ' + wide + '*',
    '',
    '🔒 **Arming Roleplay**',
    brQuote(g('br-cc-arm').value, '> [Arming script]'),
    '',
    '🔓 **Disarming Roleplay**',
    brQuote(g('br-cc-disarm').value, '> [Disarming script]'),
    '',
    '<:SPAUpperManagement:1028766645696606280> | **Airport Roles**',
    airport,
    '',
    '✈️ | **Onboard Roles**',
    onboard,
    '',
    '**Signed, <@1327108083281035325>**',
    '<:SPA:795664970800824360> **south**pacific.'
  ].join('\n');
}

// ── BRIEFING ROLE LOCKS ──
var BR_GATES = {
  cc:  { label: 'Cabin Crew',        ids: ['1194303157388451950'] },
  sec: { label: 'Safety & Security', ids: ['1194303260719337599'] }
};
var BR_LOCKED = {};
function applyBriefingLocks() {
  var bypass = ALL_ACCESS_IDS.indexOf(localStorage.getItem('spa_discord_id')) !== -1;
  var roles = [];
  try { roles = JSON.parse(localStorage.getItem('spa_discord_roles') || '[]'); } catch (e) {}
  Object.keys(BR_GATES).forEach(function (k) {
    var gt = BR_GATES[k];
    var ok = bypass || gt.ids.some(function (id) { return roles.indexOf(id) !== -1; });
    BR_LOCKED[k] = ok ? null : gt.label;
  });
  var btns = [].slice.call(document.querySelectorAll('#br-auto-row button'));
  btns.forEach(function (b) {
    var m = (b.getAttribute('onclick') || '').match(/selBRAuto\('(\w+)'/);
    if (!m) return;
    var lock = BR_LOCKED[m[1]];
    b.classList.toggle('locked', !!lock);
    b.title = lock ? 'Locked: requires the ' + lock + ' role' : '';
  });
  var open = btns.filter(function (b) {
    var mm = (b.getAttribute('onclick') || '').match(/selBRAuto\('(\w+)'/);
    return mm && !BR_LOCKED[mm[1]];
  });
  var pick = open.filter(function (b) { return b.classList.contains('active'); })[0] || open[0];
  if (pick) pick.click();
  else ['br-cc', 'br-sec'].forEach(function (id) { document.getElementById(id).style.display = 'none'; });
}

// ── RANDOM PICKER + BIG BRIEFING SHEET ──
var BIG_BRIEFING_URL = '';  // paste the big briefing sheet link here
function rpPick() {
  var users = (g('rp-users').value || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
  var tasks = (g('rp-tasks').value || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
  if (!users.length || !tasks.length) { g('rp-out').value = 'Add at least one user and one task.'; return; }
  var shuffled = users.slice();
  for (var i = shuffled.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = t;
  }
  g('rp-out').value = tasks.map(function (task, n) {
    return task + ' → ' + (shuffled[n] || '(nobody left)');
  }).join('\n');
}
function rpOpenBriefing() {
  if (!BIG_BRIEFING_URL) { g('toast').textContent = 'Big briefing sheet link not set yet'; showToast(); return; }
  window.open(BIG_BRIEFING_URL, '_blank');
}

// ── FILL BRIEFING SHEETS FROM A PASTED SHEET (big briefing sheet or a Cabin Crew sheet) ──
var BR_PARSED = null;
var BR_ROLE_TIMER = null;
function brShuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}
function brLinesOf(id) {
  return (g(id).value || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
}
function brParseSheet(text) {
  var res = { flight: '', aircraft: '', host: '', arm: [], disarm: [], cc: [], sec: [], roleMentions: [],
              ccAir: [], ccOnb: [], secRoles: [], ccManager: '' };
  var fm = text.match(/SPA\s?(\d+)/);
  if (fm) res.flight = fm[1];
  var cs = text.match(/Callsign:\s*SPA\s?(\d+)/);
  if (cs) res.flight = cs[1];
  var am = text.match(/via the \*\*([^*]+)\*\*/) || text.match(/via the ([^*,\n]+?),/) || text.match(/Aircraft:\s*([^|*\n]+)/);
  if (am) res.aircraft = am[1].trim();
  var hm = text.match(/Flight Host:\s*([^*\n]+)/) || text.match(/hosted by\s+([^*\n]+)/);
  if (hm) res.host = hm[1].trim();

  var cur = '', block = '', seen = {};
  text.split('\n').forEach(function (raw) {
    var line = raw.trim();
    var plain = line.replace(/\*/g, '');
    // big briefing sheet section headings: "| *Cabin Crew*"
    var h = line.match(/\|\s*\*([^*]+)\*\s*$/);
    if (h) { cur = h[1].trim(); block = ''; return; }
    if (!line) { block = ''; return; }
    // Cabin Crew sheet headings
    if (/Airport Roles/i.test(plain)) { block = 'air'; return; }
    if (/Onboard Roles/i.test(plain)) { block = 'onb'; return; }
    if (/Arming Roleplay/i.test(plain)) { block = 'arm'; return; }
    if (/Disarming Roleplay/i.test(plain)) { block = 'disarm'; return; }
    if (/Role Assignments/i.test(plain)) { block = 'sec'; return; }
    if (line.charAt(0) !== '>') block = '';
    var body = line.replace(/^>\s*/, '').trim();
    if (block === 'arm' && body) res.arm.push(body);
    else if (block === 'disarm' && body) res.disarm.push(body);
    else if (block === 'air' && /<@/.test(body)) res.ccAir.push(body.replace(/\s*\|\s*/, ' | '));
    else if (block === 'onb' && /<@/.test(body)) res.ccOnb.push(body.replace(/\s*\|\s*/, ' | '));
    else if (block === 'sec' && /→/.test(body)) res.secRoles.push(body);

    // mentions in big briefing sheet sections
    var re = /<@(&?)!?(\d+)>/g, m;
    while ((m = re.exec(line)) !== null) {
      var isRole = m[1] === '&', id = m[2];
      if (isRole) { res.roleMentions.push(cur + ': <@&' + id + '>'); continue; }
      var key = cur + '|' + id;
      if (seen[key]) continue;
      seen[key] = true;
      if (cur === 'Managers' && /Cabin Crew:/i.test(line)) res.ccManager = id;
      else if (cur === 'Cabin Crew') res.cc.push(id);
      else if (cur === 'Safety & Security') res.sec.push(id);
    }
  });
  return res;
}
// pasted sheet: fill everything it can, then generate the rest
function brPasted() {
  var text = g('br-paste').value || '';
  localStorage.setItem('spa_br_paste', text);
  BR_PARSED = text.trim() ? brParseSheet(text) : null;
  if (BR_PARSED) {
    var r = BR_PARSED;
    if (r.flight) g('br-route').value = r.flight;
    if (r.host) g('br-host').value = r.host;
    if (r.aircraft) {
      var sel = g('br-plane');
      var hit = [].slice.call(sel.options).filter(function (o) { return r.aircraft.indexOf(o.value) !== -1; })[0];
      if (hit) sel.value = hit.value;
    }
    brApplyScripts();
    if (r.arm.length) g('br-cc-arm').value = r.arm.join('\n');
    if (r.disarm.length) g('br-cc-disarm').value = r.disarm.join('\n');
  }
  brGenerate(false);
}
// role boxes: save, then regenerate shortly after typing stops
function brRoleBoxChanged() {
  localStorage.setItem('spa_br_roles', JSON.stringify({
    air: g('br-role-air').value, onb: g('br-role-onb').value, sec: g('br-role-sec').value,
  }));
  clearTimeout(BR_ROLE_TIMER);
  BR_ROLE_TIMER = setTimeout(function () { brGenerate(false); }, 500);
}
function brResetRoles() {
  g('br-role-air').value = BR_DEFAULT_ROLES.air;
  g('br-role-onb').value = BR_DEFAULT_ROLES.onb;
  g('br-role-sec').value = BR_DEFAULT_ROLES.sec;
  brRoleBoxChanged();
  brGenerate(true);
}
function brRestorePaste() {
  var saved = localStorage.getItem('spa_br_paste');
  if (!saved || !g('br-paste')) return;
  g('br-paste').value = saved;
  brPasted();
}
var BR_DEFAULT_ROLES = {
  "air": "Premium Lounge Attendant\nCustomer Service Assistant\nInvestor Lounge Attendant\nGate Agent\nGate Agent 2",
  "onb": "Premium CPT\nPremium FO\nPremium MID\nEconomy CPT\nEconomy FO\nEconomy MID\nPremium Whole\nEconomy Whole",
  "sec": "Arrival Airport Checks\nDeboard Usher\nRunway Inspection\nBus Escort (if needed)\nAir Marshal"
};
function brRestoreRoles() {
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem('spa_br_roles') || '{}') || {}; } catch (e) {}
  if (g('br-role-air')) g('br-role-air').value = saved.air || BR_DEFAULT_ROLES.air;
  if (g('br-role-onb')) g('br-role-onb').value = saved.onb || BR_DEFAULT_ROLES.onb;
  if (g('br-role-sec')) g('br-role-sec').value = saved.sec || BR_DEFAULT_ROLES.sec;
}
// Security assignment, matched to the Safety & Security guides:
//  - Air Marshal: one person, only this role, stays on the plane the whole time (never deboards)
//  - Paramedic: on normal and emergency flights; with 3+ people one Paramedic takes Arrival Airport Checks and Deboard Usher
//  - Runway Inspection and Deboard Usher: Airport Police (guides)
//  - Arrival Airport Checks and Tarmac Patrol: Security Agent (guides)
//  - Bus Escort: at most two people (one car front, one back)
function brAssignSEC(people, pool) {
  var TITLE = { 'Runway Inspection': 'Airport Police', 'Deboard Usher': 'Airport Police',
                'Arrival Airport Checks': 'Security Agent', 'Tarmac Patrol': 'Security Agent' };
  var isAM = function (x) { return /air marshal/i.test(x); };
  var isBus = function (x) { return /bus escort/i.test(x); };
  var isMedRole = function (x) { return /arrival airport check|deboard usher/i.test(x); };
  var order = brShuffle(people.slice());
  var assigned = {};

  var am = pool.filter(isAM)[0];
  if (am && order.length) {
    var amId = order.shift();
    assigned[amId] = { title: 'Air Marshal', roles: ['Air Marshal'] };
  }

  var medRoles = [];
  if (order.length >= 3) {
    var medId = order.shift();
    medRoles = pool.filter(isMedRole).slice(0, 2);
    assigned[medId] = { title: 'Paramedic', roles: medRoles };
  }

  // remaining roles go round the remaining people, two roles each at most
  var base = pool.filter(function (x) { return !isAM(x) && !isBus(x); });
  base.forEach(function (role, n) {
    if (!order.length) return;
    var id = order[n % order.length];
    var title = TITLE[role] || 'Security Agent';
    if (!assigned[id]) assigned[id] = { title: title, roles: [] };
    if (assigned[id].roles.length < 2) assigned[id].roles.push(role);
  });

  // Bus Escort: two people at most, never the Air Marshal
  if (pool.some(isBus)) {
    var escorts = order.filter(function (id) { return !assigned[id] || assigned[id].title !== 'Air Marshal'; }).slice(0, 2);
    escorts.forEach(function (id) {
      if (!assigned[id]) assigned[id] = { title: 'Security Agent', roles: [] };
      assigned[id].roles.push('Bus Escort (if needed)');
    });
  }

  return people.map(function (id) {
    var a = assigned[id];
    return (a && a.roles.length)
      ? '<@' + id + '> • *' + a.title + '* → *' + a.roles.join(', ') + '*'
      : '<@' + id + '> • *Security Agent* → *Roles*';
  });
}


// Safety & Security briefing templates (normal and bus escort), one row per Security person
var SY_TEMPLATE = {
  normal: [
    [['Security Agent',['Runway Inspection','Arrival Airport Checks','Deboard Usher']]],
    [['Security Agent',['Runway Inspection','Deboard Usher']],['Airport Police',['Arrival Airport Checks','Deboard Usher']]],
    [['Security Agent',['Arrival Airport Checks','Deboard Usher']],['Airport Police',['Arrival Airport Checks','Deboard Usher']],['Paramedic',['Runway Inspection','Deboard Usher']]],
    [['Security Agent',['Arrival Airport Checks','Deboard Usher']],['Airport Police',['Arrival Airport Checks','Deboard Usher']],['Paramedic',['Runway Inspection','Deboard Usher']],['Airport Police',['Air Marshal']]]
  ],
  bus: [
    [['Security Agent',['Runway Inspection','Arrival Airport Checks','Deboard Usher','Bus Escort']]],
    [['Security Agent',['Runway Inspection','Deboard Usher']],['Airport Police',['Arrival Airport Checks','Deboard Usher','Bus Escort']]],
    [['Security Agent',['Arrival Airport Checks','Deboard Usher']],['Airport Police',['Arrival Airport Checks','Deboard Usher','Bus Escort']],['Paramedic',['Runway Inspection','Deboard Usher']]],
    [['Security Agent',['Arrival Airport Checks','Deboard Usher']],['Airport Police',['Arrival Airport Checks','Deboard Usher','Bus Escort']],['Paramedic',['Runway Inspection','Deboard Usher']],['Airport Police',['Air Marshal']]]
  ]
};
function brSecTemplate(people, bus) {
  var n = people.length;
  if (!n) return [];
  var rows = (bus ? SY_TEMPLATE.bus : SY_TEMPLATE.normal)[Math.min(n, 4) - 1];
  return people.map(function (id, i) {
    var row = rows[i % rows.length];
    return '<@' + id + '> • *' + row[0] + '* → *' + row[1].join(', ') + '*';
  });
}
// Cabin Crew assignment, matched to the sheets:
//  - Economy: up to two people, Gate Agents first, CPT then FO
//  - one Premium class per flight (Investor, First Class or Business, whichever is in the box): up to two people, CPT then FO
//  - a class with only one person gets its Whole role, if the box has one
//  - with six or more crew, the CPT person of a two-person class also does MID
//  - anyone without a seat stays on airport roles only (no onboard line), as on the sheets
//  - each onboard person gets a door pair in order: Arm/Disarm L1 & R1, L2 & R2, ...
//  - airport roles: Gate Agents take the Gate Agent slots, the lead takes a lounge role, the rest take unique airport roles
function brAssignCC(people, airPool, onPool, manager) {
  var isGate = function (x) { return /gate agent/i.test(x); };
  var gateAir = brShuffle(airPool.filter(isGate));
  var otherAir = airPool.filter(function (x) { return !isGate(x); });
  var lounge = otherAir.filter(function (x) { return /lounge/i.test(x); });

  var order = brShuffle(people.slice());
  if (manager && order.indexOf(manager) === -1) order.push(manager);
  var total = order.length;
  // Cabin Crew Checklist tables for 1-4 crew (self-assign when there is no Cabin Manager)
  var CHECKLIST = {
    1: { air: ['Premium Lounge Attendant'], onb: [['Whole aircraft', 'Arm/Disarm L1']], gates: 0 },
    2: { air: ['Premium Lounge Attendant', 'Gate Agent'], onb: [['Premium Whole', 'Arm/Disarm L1'], ['Economy Whole', 'Arm/Disarm R1']], gates: 1 },
    3: { air: ['Premium Lounge Attendant', 'Gate Agent', 'Customer Service Assistant'], onb: [['Premium Whole', 'Arm/Disarm L1 & R1'], ['Economy CPT', 'Arm/Disarm L2'], ['Economy FO', 'Arm/Disarm R2']], gates: 1 },
    4: { air: ['Premium Lounge Attendant', 'Customer Service Assistant', 'Gate Agent', 'Premium Lounge Attendant - Table Service'], onb: [['Premium CPT', 'Arm/Disarm L1 & R1'], ['Premium FO', 'Arm/Disarm L2 & R2'], ['Economy CPT', 'Arm/Disarm L3'], ['Economy FO', 'Arm/Disarm R3']], gates: 1 }
  };
  var AIRPORT_ORDER_7 = ['Premium Lounge Attendant','Gate Agent','Customer Service Assistant','Investor Lounge Attendant','Gate Agent','Premium Lounge - Table Service','Investor Lounge - Table Service'];
  if (CHECKLIST[total]) {
    var T = CHECKLIST[total];
    return {
      air: T.air.map(function (r, i) { return '<@' + order[i] + '> | ' + r; }),
      onb: T.onb.map(function (o, i) { return '<@' + order[i] + '> | ' + o[0] + ', ' + o[1]; }),
      gates: T.gates, noAir: 0, noOnb: 0, destCount: 0, classes: ['Economy', 'Premium']
    };
  }

  var airOf = {}, onOf = {};
  var gateCount = Math.min(gateAir.length, total >= 5 ? 2 : 1, total);
  var gates = order.slice(0, gateCount);
  var rest = order.slice(gateCount);
  gates.forEach(function (id, n) { airOf[id] = gateAir[n]; });
  var airLeft = brShuffle(otherAir.slice());
  var lead = rest.shift();
  if (lead) {
    var lr = lounge[0] || airLeft[0];
    if (lr) { airOf[lead] = lr; airLeft = airLeft.filter(function (x) { return x !== lr; }); }
  }
  rest.forEach(function (id, n) {
    if (airLeft.length) airOf[id] = airLeft.shift();
    else if (otherAir.length) airOf[id] = otherAir[n % otherAir.length];
  });

  // onboard: Economy plus every ticked premium class that is in the box
  var classOf = function (x) { var m = x.match(/^(.+?)\s+(CPT|FO|MID|Whole)\b/i); return m ? m[1].trim() : null; };
  var classes = ['Economy', 'Premium'].filter(function (c) {
    return onPool.some(function (x) { return classOf(x) && classOf(x).toLowerCase() === c.toLowerCase(); });
  });
  var onFallback = (BR_DEFAULT_ROLES.onb || '').split('\n');
  var roleFor = function (c, kind) {
    var re = new RegExp('\\b' + kind + '\\b', 'i');
    var hit = function (x) { return classOf(x) && classOf(x).toLowerCase() === c.toLowerCase() && re.test(x); };
    // use the box first; if the box is missing this role, use the default for it so no seat is left blank
    return onPool.filter(hit)[0] || onFallback.filter(hit)[0] || null;
  };

  // 5-7 crew: airport roles follow the briefing templates
  if (total >= 5 && total <= 7) {
    order.forEach(function (id, i) { airOf[id] = AIRPORT_ORDER_7[i]; });
    gates = order.filter(function (id) { return airOf[id] === 'Gate Agent'; });
  }
  // Premium and Economy only, as on the sheets:
  // premium takes 2 people (1 on a 2-3 crew flight), economy takes up to 2 (Gate Agents first),
  // a class with one person gets its Whole role, and anyone left over is Destination Crew.
  var placed = {};
  var P = total >= 4 ? 2 : 1;
  var econTarget = Math.min(2, total - P);
  var econPeople = gates.slice(0, Math.max(econTarget, 0));
  econPeople.forEach(function (id) { placed[id] = true; });
  var premPeople = [];
  if (classes.indexOf('Premium') !== -1) {
    premPeople = order.filter(function (id) { return !placed[id]; }).slice(0, P);
    premPeople.forEach(function (id) { placed[id] = true; });
  }
  while (econPeople.length < econTarget) {
    var nextE = order.filter(function (id) { return !placed[id]; })[0];
    if (!nextE) break;
    econPeople.push(nextE); placed[nextE] = true;
  }
  var assignClass = function (people, c) {
    if (!people.length) return;
    if (people.length === 1) { onOf[people[0]] = roleFor(c, 'Whole') || roleFor(c, 'CPT') || roleFor(c, 'FO') || '[Insert roles]'; return; }
    onOf[people[0]] = roleFor(c, 'CPT') || '[Insert roles]';
    onOf[people[1]] = roleFor(c, 'FO') || '[Insert roles]';
  };
  if (classes.indexOf('Economy') !== -1) assignClass(econPeople, 'Economy');
  if (classes.indexOf('Premium') !== -1) assignClass(premPeople, 'Premium');
  order.forEach(function (id) { if (!placed[id]) onOf[id] = 'Destination Crew'; });

  // a class with exactly one person gets its Whole role, if the box has one
  var perClass = {};
  Object.keys(onOf).forEach(function (id) {
    var c = classOf(onOf[id]);
    if (c) perClass[c] = (perClass[c] || []).concat([id]);
  });
  Object.keys(perClass).forEach(function (c) {
    if (perClass[c].length === 1) {
      var w = roleFor(c, 'Whole');
      if (w) onOf[perClass[c][0]] = w;
    }
  });
  // with six or more crew, the CPT person of a two-person class also does MID
  if (total >= 6) {
    Object.keys(perClass).forEach(function (c) {
      if (perClass[c].length === 2 && roleFor(c, 'MID')) {
        var cpt = perClass[c].filter(function (id) { return /\bCPT\b/i.test(onOf[id]); })[0];
        if (cpt) onOf[cpt] = onOf[cpt] + ' & MID';
      }
    });
  }

  // onboard lines get door pairs in order; anyone without a seat stays on airport roles only
  var onboardIds = order.filter(function (id) { return onOf[id]; });
  return {
    air: order.filter(function (id) { return airOf[id]; }).map(function (id) { return '<@' + id + '> | ' + airOf[id]; }),
    onb: (function () {
      var n = 0;
      return onboardIds.map(function (id) {
        if (onOf[id] === 'Destination Crew') return '<@' + id + '> | Destination Crew';
        n++;
        return '<@' + id + '> | ' + onOf[id] + ', Arm/Disarm L' + n + ' & R' + n;
      });
    })(),
    gates: gates.length,
    noAir: order.filter(function (id) { return !airOf[id]; }).length,
    noOnb: 0,
    destCount: order.filter(function (id) { return onOf[id] === 'Destination Crew'; }).length,
    classes: classes
  };
}

// build the assignments: use roles already written on the sheet, otherwise generate them
function brGenerate(reroll) {
  var status = g('br-fill-status');
  if (!BR_PARSED) { status.textContent = 'Paste the briefing sheet first.'; return; }
  var r = BR_PARSED;
  var notes = [];
  var flight = r.flight ? 'SPA' + r.flight : 'not found';
  var ccCount, msg;

  if (r.ccAir.length || r.ccOnb.length) {
    // Cabin Crew sheet: the roles are already written, so use them as they are
    var ids = {};
    r.ccAir.concat(r.ccOnb).forEach(function (l) { var m = l.match(/<@!?(\d+)>/); if (m) ids[m[1]] = true; });
    ccCount = Object.keys(ids).length;
    g('br-cc-count').value = ccCount;
    g('br-cc-airport').value = r.ccAir.join('\n');
    g('br-cc-onboard').value = r.ccOnb.join('\n');
    msg = 'Cabin Crew roles taken from the sheet (' + ccCount + ' people).';
  } else {
    // big briefing sheet: generate Cabin Crew roles from the role boxes
    var airPool = brLinesOf('br-role-air');
    var onPool = brLinesOf('br-role-onb');
    var res = brAssignCC(r.cc, airPool, onPool, r.ccManager);
    ccCount = r.cc.length;
    g('br-cc-count').value = ccCount;
    g('br-cc-airport').value = airPool.length ? res.air.join('\n')
      : r.cc.map(function (id) { return '<@' + id + '> | [Role]'; }).join('\n');
    g('br-cc-onboard').value = onPool.length ? res.onb.join('\n')
      : r.cc.map(function (id) { return '<@' + id + '> | [Insert roles]'; }).join('\n');
    if (airPool.length && res.noAir) notes.push(res.noAir + ' Cabin Crew have no airport role (add more to the Airport box).');
    if (airPool.length && r.cc.length && !res.gates) notes.push('No Gate Agent was given out (add Gate Agent to the Airport box).');
    if (!airPool.length || !onPool.length) notes.push('Fill the Airport and Onboard boxes to assign Cabin Crew roles.');
    if (res.destCount) notes.push(res.destCount + ' Cabin Crew ' + (res.destCount === 1 ? 'is' : 'are') + ' on Destination Crew (more crew than onboard seats).');
    msg = 'Found ' + ccCount + ' Cabin Crew (' + res.gates + ' Gate Agent).' + (r.ccManager ? ' CC Manager is on standby to step in.' : '')
      + ' Classes: ' + res.classes.join(', ') + '.';
  }

  if (r.secRoles.length) {
    // Security sheet: roles already written, use them as they are
    g('br-sy').value = r.secRoles.length;
    g('br-sec-roles').value = r.secRoles.join('\n');
    msg += ' ' + r.secRoles.length + ' Security roles taken from the sheet.';
  } else {
    // Security: rules in brAssignSEC
    g('br-sy').value = r.sec.length;
    g('br-sec-roles').value = brSecTemplate(r.sec, !!(g('br-bus') && g('br-bus').checked)).join('\n');
    msg += ' ' + r.sec.length + ' Security.';
  }

  var allIds = [];
  r.cc.concat(r.sec).forEach(function (id) { allIds.push(id); });
  (r.ccAir.concat(r.ccOnb, r.secRoles)).forEach(function (l) { var m = l.match(/<@!?(\d+)>/); if (m) allIds.push(m[1]); });
  var uniq = allIds.filter(function (id, i) { return allIds.indexOf(id) === i; });
  g('rp-users').value = uniq.map(function (id) { return '<@' + id + '>'; }).join('\n');
  var roleNames = [];
  ['br-role-air', 'br-role-onb', 'br-role-sec'].forEach(function (b) {
    brLinesOf(b).forEach(function (x) { if (roleNames.indexOf(x) === -1) roleNames.push(x); });
  });
  g('rp-tasks').value = roleNames.join('\n');
  var missingRoles = (g('br-cc-onboard').value.indexOf('[Insert roles]') !== -1) ? ' Some onboard roles are missing from the Onboard box. Press Reset role boxes to defaults.' : '';
  var skipped = r.roleMentions.length ? ' Skipped ' + r.roleMentions.length + ' role mention(s), so check those by hand.' : '';
  var dep = brDeparture((g('br-route').value || '').trim());
  var seatNote = brSeatNote(ccCount, g('br-plane').value, dep);
  status.textContent = msg + ' Flight ' + flight + '.' + seatNote + (notes.length ? ' ' + notes.join(' ') : '') + skipped + missingRoles + (reroll ? ' Roles re-rolled.' : '');
  brRender();
}

// ── ARMING / DISARMING SCRIPTS BY AIRCRAFT TYPE ──
var BR_SCRIPTS = {
  "Airbus A220": {
    "arm": [
      "-removes key lock and stores away-",
      "-pushes lock lever up-",
      "-checks if green light appears to confirm door locked-"
    ],
    "disarm": [
      "-turns key lock on key hole-",
      "-pushes lock lever down-",
      "-checks if red light appears to confirm door unlocked-"
    ]
  },
  "Airbus A318": {
    "arm": [
      "-removes safety pin with red flag and stores away-",
      "-pushes arming control lever down-",
      "-ensures the indicator reads 'armed'-"
    ],
    "disarm": [
      "-lifts arming control lever fully up-",
      "-ensures the indicator reads 'disarmed'-",
      "-installs safety pin with the red flag-"
    ]
  },
  "Airbus A319": {
    "arm": [
      "-removes safety pin with red flag and stores away-",
      "-pushes arming control lever down-",
      "-ensures the indicator reads 'armed'-"
    ],
    "disarm": [
      "-lifts arming control lever fully up-",
      "-ensures the indicator reads 'disarmed'-",
      "-installs safety pin with the red flag-"
    ]
  },
  "Airbus A320": {
    "arm": [
      "-removes safety pin with red flag and stores away-",
      "-pushes arming control lever down-",
      "-ensures the indicator reads 'armed'-"
    ],
    "disarm": [
      "-lifts arming control lever fully up-",
      "-ensures the indicator reads 'disarmed'-",
      "-installs safety pin with the red flag-"
    ]
  },
  "Airbus A321neo": {
    "arm": [
      "-removes safety pin with red flag and stores away-",
      "-pushes arming control lever down-",
      "-ensures the indicator reads 'armed'-"
    ],
    "disarm": [
      "-lifts arming control lever fully up-",
      "-ensures the indicator reads 'disarmed'-",
      "-installs safety pin with the red flag-"
    ]
  },
  "Airbus A330": {
    "arm": [
      "-slides open protective cover-",
      "-removes safety pin with red streamer-",
      "-changes arming lever mode to 'armed'-",
      "-closes protective cover-"
    ],
    "disarm": [
      "-slides open protective cover-",
      "-changes arming lever mode to 'disarmed'-",
      "-inserts safety pin with red streamer-",
      "-closes protective cover-"
    ]
  },
  "Airbus A350": {
    "arm": [
      "-slides open protective cover-",
      "-removes safety pin with red streamer-",
      "-changes arming lever mode to 'armed'-",
      "-closes protective cover-"
    ],
    "disarm": [
      "-slides open protective cover-",
      "-changes arming lever mode to 'disarmed'-",
      "-inserts safety pin with red streamer-",
      "-closes protective cover-"
    ]
  },
  "Boeing 737-MAX8": {
    "arm": [
      "-unclicks & places red flag across window-",
      "-crouches onto floor towards door-",
      "-detaches girt bar from hooks-",
      "-inserts girt bar into floor brackets-"
    ],
    "disarm": [
      "-crouches onto floor towards door-",
      "-detaches girt bar from floor brackets-",
      "-stows girt bar into hooks-",
      "-unclicks & places red flag to normal position-"
    ]
  },
  "Boeing 777-300ER": {
    "arm": [
      "-opens access cover, moves the mode selector to 'automatic' position-",
      "-crouches onto floor towards door-",
      "-checks the girt bar indicator flag viewing windows are yellow-"
    ],
    "disarm": [
      "-opens access cover, moves the mode selector to 'manual' position-",
      "-crouches onto floor towards door-",
      "-checks the girt bar indicator flag viewing windows are black-"
    ]
  },
  "Boeing 787-9": {
    "arm": [
      "-pulls safety lever-",
      "-rotates arming control lever to the right-",
      "-pulls down the door lock lever-"
    ],
    "disarm": [
      "-pulls up the door lock lever-",
      "-pulls safety lever-",
      "-rotates the arming control to the left-"
    ]
  }
};
function brApplyScripts() {
  var sc = BR_SCRIPTS[g('br-plane').value];
  g('br-cc-arm').value = sc ? sc.arm.join('\n') : '';
  g('br-cc-disarm').value = sc ? sc.disarm.join('\n') : '';
  brRender();
}

// ── AIRCRAFT SEAT DATA (Fleet tab + Briefing checks) ──
var SEATS = {
 "Airbus A220-300": {
  "grounded": false,
  "note": "",
  "variants": [
   {
    "name": "Standard",
    "cockpit": 2,
    "cc": 4,
    "premium": "Investors/First/Business 15",
    "economy": 72,
    "pax": 87,
    "staff": 6
   }
  ]
 },
 "Airbus A318": {
  "grounded": false,
  "note": "Double jumpseats could only occupy one cabin crew.",
  "variants": [
   {
    "name": "Standard",
    "cockpit": 2,
    "cc": 6,
    "premium": "Investor/First/Business 16",
    "economy": 40,
    "pax": 56,
    "staff": 8
   }
  ]
 },
 "Airbus A319": {
  "grounded": true,
  "note": "Grounded and not for use. Image to be added, aircraft is still in development.",
  "variants": [
   {
    "name": "Standard",
    "cockpit": 2,
    "cc": 6,
    "premium": "Investor/First/Business 16",
    "economy": 60,
    "pax": 76,
    "staff": 8
   }
  ]
 },
 "Airbus A320-231": {
  "grounded": false,
  "note": "",
  "variants": [
   {
    "name": "A320-214",
    "cockpit": 2,
    "cc": 6,
    "premium": "Investors/First/Business 16",
    "economy": 102,
    "pax": 118,
    "staff": 8
   }
  ]
 },
 "Airbus A321neo": {
  "grounded": false,
  "note": "",
  "variants": [
   {
    "name": "Standard",
    "cockpit": 2,
    "cc": 7,
    "premium": "Investors/First/Business 24",
    "economy": 126,
    "pax": 150,
    "staff": 9
   }
  ]
 },
 "Airbus A330-941neo": {
  "grounded": true,
  "note": "Grounded and not for use.",
  "variants": [
   {
    "name": "Standard",
    "cockpit": 4,
    "cc": 13,
    "premium": "Investors/First 24, Business 16",
    "economy": 130,
    "pax": 170,
    "staff": 17
   }
  ]
 },
 "Airbus A350-900": {
  "grounded": false,
  "note": "Do not use at Mark Neris due to rendering issues. No seats in the cabin between doors L3 and L4.",
  "variants": [
   {
    "name": "Standard",
    "cockpit": 2,
    "cc": 14,
    "premium": "Investor/First 20, Business 21",
    "economy": 99,
    "pax": 140,
    "staff": 16
   }
  ]
 },
 "Boeing 737 MAX 8": {
  "grounded": false,
  "note": "Do not use in Punta Cana or Southwest Regional. Staff/passengers who join after insertion will be stuck on infinite load.",
  "variants": [
   {
    "name": "MAX",
    "cockpit": 2,
    "cc": 8,
    "premium": "Investor 4, First/Business 12",
    "economy": 108,
    "pax": 124,
    "staff": 10
   },
   {
    "name": "ECO livery",
    "cockpit": 2,
    "cc": 8,
    "premium": "Investor/First/Business 20",
    "economy": 108,
    "pax": 128,
    "staff": 10
   }
  ]
 },
 "Boeing 747-400": {
  "grounded": true,
  "note": "Grounded and not for use YET. Real time updates in #status-tracker under 'Information'.",
  "variants": [
   {
    "name": "Standard",
    "cockpit": 2,
    "cc": 19,
    "premium": "Investors 12, First 24, Business 22",
    "economy": 105,
    "pax": "163 + 11 lavatory seats",
    "staff": 21
   }
  ]
 },
 "Boeing 787-9 Dreamliner": {
  "grounded": false,
  "note": "The cabin between L3 and L4 does not contain any passenger seats. Available for all passengers.",
  "variants": [
   {
    "name": "Standard",
    "cockpit": 2,
    "cc": 10,
    "premium": "Investors 6, First 11, Business 14",
    "economy": 56,
    "pax": 87,
    "staff": 11
   },
   {
    "name": "Executive livery",
    "cockpit": 2,
    "cc": 0,
    "premium": "Investors 37 + 3 bathroom + 2 bedroom 1 + 2 bedroom 2 (44)",
    "economy": 0,
    "pax": 44,
    "staff": 2,
    "note": "Economy passengers strictly prohibited. Fragile, will fling easily at taxiway junctions. Private/alliance/special flights only."
   }
  ]
 },
 "Boeing 777-300ER": {
  "grounded": true,
  "note": "Grounded and not for use.",
  "variants": [
   {
    "name": "Standard",
    "cockpit": 2,
    "cc": 10,
    "premium": "Investors 12, First 30, Business 21",
    "economy": 144,
    "pax": 207,
    "staff": 12
   }
  ]
 }
};
var BR_PLANE_KEY = {"Airbus A220": "Airbus A220-300", "Airbus A318": "Airbus A318", "Airbus A319": "Airbus A319", "Airbus A320": "Airbus A320-231", "Airbus A321neo": "Airbus A321neo", "Airbus A330": "Airbus A330-941neo", "Airbus A350": "Airbus A350-900", "Boeing 737-MAX8": "Boeing 737 MAX 8", "Boeing 777-300ER": "Boeing 777-300ER", "Boeing 787-9": "Boeing 787-9 Dreamliner"};
function fleetAddSeats() {
  var rows = document.querySelectorAll('#page-fleet tbody tr');
  rows.forEach(function (tr) {
    var first = tr.querySelector('td');
    if (!first) return;
    var name = first.textContent.trim();
    var d = SEATS[name];
    if (!d) return;
    var cards = d.variants.map(function (v) {
      var note = v.note || d.note || '';
      return '<div style="margin-top:8px;padding:10px 12px;border:1px solid #1a3456;border-radius:10px;background:#0a1a30">'
        + (d.variants.length > 1 ? '<div style="font-weight:700;color:#fff;margin-bottom:6px">' + v.name + '</div>' : '')
        + '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 16px;font-size:.78rem;color:#9bb8d4">'
        + '<span>Cockpit: ' + v.cockpit + '</span><span>Cabin crew jumpseats: ' + v.cc + '</span>'
        + '<span>Premium: ' + v.premium + '</span><span>Economy: ' + v.economy + '</span>'
        + '<span>Passengers: ' + v.pax + '</span><span>Staff: ' + v.staff + '</span>'
        + '</div>'
        + (note ? '<div style="margin-top:6px;font-size:.74rem;color:#f0b429">' + note + '</div>' : '')
        + '</div>';
    }).join('');
    first.innerHTML = name + '<details style="margin-top:6px"><summary style="cursor:pointer;color:#2196f3;font-size:.74rem;font-weight:700">Seats</summary>' + cards + '</details>';
  });
}
document.addEventListener('DOMContentLoaded', fleetAddSeats);

// briefing checks against the seat data
function brDeparture(flight) {
  if (!flight || typeof ROUTES === 'undefined') return '';
  for (var ap in ROUTES) { if (ROUTES[ap].routes && ROUTES[ap].routes['SPA' + flight]) return ROUTES[ap].icao; }
  return '';
}
function brSeatNote(ccCount, plane, dep) {
  var d = SEATS[BR_PLANE_KEY[plane]];
  if (!d) return '';
  var v = d.variants[0];
  var out = ' ' + plane + ': ' + v.staff + ' staff seats.';
  if (ccCount > v.staff) out += ' WARNING: ' + ccCount + ' Cabin Crew but only ' + v.staff + ' staff seats.';
  if (d.grounded) out += ' WARNING: this aircraft is grounded.';
  if (plane === 'Boeing 737-MAX8' && (dep === 'MDPC' || dep === 'KABY')) out += ' WARNING: do not use the 737-8MAX at Punta Cana or Southwest Regional.';
  return out;
}

setInterval(function () { applyCohostAirport(); }, 30000);
// ── ROUTE INFO (route list + seat data + ATC taxi routes) ──
var ATC_CHARTS = {
 "London Heathrow": {
  "icao": "EGLL",
  "dep": "Quebec Lima to 27 (you may also take a taxiway like Quebec 1, 2, 3, 4, Charlie, Hotel or Romeo and make a left on Lima to enter the RW)",
  "arr": "Any of the exits to Alpha to the ramp"
 },
 "Mark Neris": {
  "icao": "KMNI",
  "dep": "Bravo Charlie Foxtrot to 09",
  "arr": "B/B6 Lima Echo Delta to the ramp"
 },
 "Punta Cana": {
  "icao": "MDPC",
  "dep": "Victor Sierra to 36",
  "arr": "Any exit Yankee to the ramp"
 },
 "Southwest Regional": {
  "icao": "KABY",
  "dep": "Uniform Hotel Kilo Bravo to ? (check the chart)",
  "arr": "Any exit to Lima to the ramp"
 },
 "Summit Peak": {
  "icao": "KBJC",
  "dep": "Bravo, Bravo 1, to 19",
  "arr": "Lima 2, Lima, Papa 1, Papa, to the ramp"
 },
 "Paine Field": {
  "icao": "KPAE",
  "dep": "Charlie Alpha Alpha 1 to 16",
  "arr": "Any exit, Hotel, any B1, B2, B3, B4, Bravo to the ramp"
 },
 "Ronald Reagan": {
  "icao": "KDCA",
  "dep": "Juliett, Echo to Runway 01",
  "arr": "Bravo [X], Bravo, Papa to the ramp"
 }
};
var AC_TOKEN_SEAT = [['A318','Airbus A318'],['A319','Airbus A319'],['A320','Airbus A320-231'],['A321','Airbus A321neo'],['A330','Airbus A330-941neo'],['A350','Airbus A350-900'],['A220','Airbus A220-300'],['737','Boeing 737 MAX 8'],['777','Boeing 777-300ER'],['787','Boeing 787-9 Dreamliner']];
function routeFind(rid) {
  var key = 'SPA' + rid;
  for (var ap in ROUTES) { var r = ROUTES[ap].routes && ROUTES[ap].routes[key]; if (r) return { key: key, dep: ap, r: r }; }
  return null;
}
function riSeatRows(key, rows) {
  var d = SEATS[key];
  if (!d) return;
  rows.push(['Seat data for', key]);
  d.variants.forEach(function (v) {
    var label = d.variants.length > 1 ? v.name + ': ' : '';
    rows.push([label + 'Cockpit seats', String(v.cockpit)]);
    rows.push([label + 'Cabin crew jumpseats', String(v.cc)]);
    rows.push([label + 'Premium seats', v.premium]);
    rows.push([label + 'Economy seats', String(v.economy)]);
    rows.push([label + 'Passengers', String(v.pax)]);
    rows.push([label + 'Staff seats', String(v.staff)]);
    var note = v.note || d.note || '';
    if (note) rows.push([label + 'Notes', note]);
  });
  if (d.grounded) rows.push(['WARNING', 'This aircraft is grounded and not for use.']);
}
function routeRows(rid, acOverride) {
  var f = routeFind(rid);
  if (!f) return null;
  var r = f.r, dep = f.dep;
  var destName = r.dest.replace(/\s*\[.*\]\s*$/, '');
  var destIcao = (r.dest.match(/\[(.*?)\]/) || [])[1] || '';
  var depIcao = ROUTES[dep].icao;
  var rows = [
    ['Flight number', f.key],
    ['Departure', dep + ' [' + depIcao + ']'],
    ['Destination', destName + (destIcao ? ' [' + destIcao + ']' : '')],
    ['Aircraft (route)', r.ac]
  ];
  var ft = calcFlightTime(depIcao, destIcao);
  rows.push(['Estimated flight time', ft ? (ft.h + ' h ' + ft.m + ' min (about ' + ft.dist + ' km)') : 'Unknown, no coordinates for ' + destIcao]);
  var seatKey = acOverride || null;
  if (!seatKey) AC_TOKEN_SEAT.forEach(function (t) { if (!seatKey && r.ac && r.ac.indexOf(t[0]) !== -1) seatKey = t[1]; });
  if (seatKey && SEATS[seatKey]) riSeatRows(seatKey, rows);
  else rows.push(['Seat data', 'No seat data for this aircraft type yet.']);
  var dc = ATC_CHARTS[dep];
  rows.push(['Departure taxi route', dc ? dc.dep : 'No chart in the ATC training for ' + dep + '.']);
  var ac2 = ATC_CHARTS[destName];
  rows.push(['Arrival taxi route', ac2 ? ac2.arr : 'No chart in the ATC training for ' + destName + '.']);
  return rows;
}
function renderRouteInfo() {
  var out = g('ri-out'); if (!out) return;
  var rid = (g('ri-route').value || '').replace(/\D/g, '');
  var acSel = g('ri-ac') ? g('ri-ac').value : '';
  if (!rid) { out.innerHTML = 'Enter a route ID.'; out.dataset.txt = ''; return; }
  var rows = routeRows(rid, acSel);
  if (!rows) { out.innerHTML = 'SPA' + rid + ' is not in the route list.'; out.dataset.txt = ''; return; }
  out.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:.84rem">' + rows.map(function (x) {
    return '<tr style="border-bottom:1px solid #1a3456"><td style="padding:7px 10px;color:#7fa6c9;width:200px;vertical-align:top">' + x[0] + '</td><td style="padding:7px 10px;color:' + (x[0] === 'WARNING' ? '#f0b429' : '#e8f1ff') + '">' + x[1] + '</td></tr>';
  }).join('') + '</table>';
  out.dataset.txt = rows.map(function (x) { return x[0] + ': ' + x[1]; }).join('\n');
}
// weather for the departure and destination airports of the route (Open-Meteo, same source as the Flight Tool)
async function riWeatherFor(icao) {
  var c = ICAO_COORDS[icao];
  if (!c) return icao + ': no coordinates';
  try {
    var res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + c[0] + '&longitude=' + c[1] + '&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto');
    var cur = (await res.json()).current;
    var tc = Math.round(cur.temperature_2m);
    return icao + ': ' + tc + '°C / ' + Math.round(tc * 9 / 5 + 32) + '°F, ' + wmoDesc(cur.weather_code) + ', wind ' + Math.round(cur.wind_speed_10m) + ' km/h ' + degToDir(cur.wind_direction_10m);
  } catch (e) { return icao + ': weather unavailable'; }
}
async function riCheckWeather() {
  var out = g('ri-wx');
  var rid = (g('ri-route').value || '').replace(/\D/g, '');
  var f = rid ? routeFind(rid) : null;
  if (!f) { out.textContent = 'Enter a valid route ID first.'; return; }
  var destIcao = (f.r.dest.match(/\[(.*?)\]/) || [])[1] || '';
  out.textContent = 'Fetching weather...';
  var lines = await Promise.all([riWeatherFor(ROUTES[f.dep].icao), riWeatherFor(destIcao)]);
  out.innerHTML = lines.map(function (l) { return '<div style="padding:4px 2px">' + l + '</div>'; }).join('');
}
function copyRouteInfo() { var t = g('ri-out').dataset.txt; if (t) cpText(t); }
// ── TRIVIA GENERATOR ──
var TRIVIA_BANK = {
 "General": [
  [
   "What is the capital of Japan?",
   "Tokyo"
  ],
  [
   "How many continents are there on Earth?",
   "7"
  ],
  [
   "What is the largest planet in our solar system?",
   "Jupiter"
  ],
  [
   "What is the chemical symbol for gold?",
   "Au"
  ],
  [
   "How many legs does a spider have?",
   "8"
  ],
  [
   "Which is the largest ocean on Earth?",
   "Pacific Ocean"
  ],
  [
   "Who painted the Mona Lisa?",
   "Leonardo da Vinci"
  ],
  [
   "How many minutes are in a day?",
   "1440"
  ],
  [
   "What is the smallest country in the world?",
   "Vatican City"
  ],
  [
   "What is the hardest natural substance?",
   "Diamond"
  ],
  [
   "Which planet is closest to the Sun?",
   "Mercury"
  ],
  [
   "How many sides does a hexagon have?",
   "6"
  ],
  [
   "What gas do plants absorb from the air?",
   "Carbon dioxide"
  ],
  [
   "What is the capital of Australia?",
   "Canberra"
  ],
  [
   "At sea level, what temperature does water boil at in Celsius?",
   "100 degrees"
  ],
  [
   "How many bones are in the adult human body?",
   "206"
  ],
  [
   "What is the largest mammal in the world?",
   "Blue whale"
  ],
  [
   "What is the chemical symbol for oxygen?",
   "O"
  ],
  [
   "How many strings does a standard guitar have?",
   "6"
  ],
  [
   "Which gas makes up most of the Earth's atmosphere?",
   "Nitrogen"
  ]
 ],
 "Aviation": [
  [
   "How many engines does an Airbus A380 have?",
   "4"
  ],
  [
   "What does ATC stand for?",
   "Air Traffic Control"
  ],
  [
   "What does ILS stand for?",
   "Instrument Landing System"
  ],
  [
   "What is the squawk code for an emergency?",
   "7700"
  ],
  [
   "What is the phonetic word for the letter N?",
   "November"
  ],
  [
   "What is the phonetic word for the letter B?",
   "Bravo"
  ],
  [
   "What does VFR stand for?",
   "Visual Flight Rules"
  ],
  [
   "What does IFR stand for?",
   "Instrument Flight Rules"
  ],
  [
   "What does TCAS stand for?",
   "Traffic Collision Avoidance System"
  ],
  [
   "What does the abbreviation APU stand for?",
   "Auxiliary Power Unit"
  ],
  [
   "Which runway direction is used for landing? Look at the runway number on the chart, what does the number represent?",
   "The compass heading, rounded to tens of degrees"
  ],
  [
   "What does a squawk code of 0000 mean?",
   "Reserved for military transponders, never used"
  ]
 ]
};
var TRIVIA_USED = {};
var TRIVIA_FULL_BANK = [":ann Question 1. | !wait 1 | :ann What is the largest planet in our solar system? | !wait 8 | :ann Answer: Jupiter", ":ann Question 2. | !wait 1 | :ann Which country is famous for the pyramids? | !wait 8 | :ann Answer: Egypt", ":ann Question 3. | !wait 1 | :ann What is the capital city of France? | !wait 8 | :ann Answer: Paris", ":ann Question 4. | !wait 1 | :ann Who painted the Mona Lisa? | !wait 8 | :ann Answer: Leonardo da Vinci", ":ann Question 5. | !wait 1 | :ann What gas do plants absorb from the atmosphere? | !wait 8 | :ann Answer: Carbon dioxide", ":ann Question 6. | !wait 1 | :ann Which ocean is the largest on Earth? | !wait 8 | :ann Answer: Pacific Ocean", ":ann Question 7. | !wait 1 | :ann How many continents are there in the world? | !wait 8 | :ann Answer: 7", ":ann Question 8. | !wait 1 | :ann Which animal is known as the “King of the Jungle”? | !wait 8 | :ann Answer: Lion", ":ann Question 9. | !wait 1 | :ann What is H2O more commonly known as? | !wait 8 | :ann Answer: Water", ":ann Question 10. | !wait 1 | :ann Which sport uses a bat, ball, and wickets? | !wait 8 | :ann Answer: Cricket", ":ann Question 11. | !wait 1 | :ann What is the fastest land animal? | !wait 8 | :ann Answer: Cheetah", ":ann Question 12. | !wait 1 | :ann Which planet is known as the Red Planet? | !wait 8 | :ann Answer: Mars", ":ann Question 13. | !wait 1 | :ann What is the hardest natural substance on Earth? | !wait 8 | :ann Answer: Diamond", ":ann Question 14. | !wait 1 | :ann Which country invented pizza? | !wait 8 | :ann Answer: Italy", ":ann Question 15. | !wait 1 | :ann Who wrote Romeo and Juliet? | !wait 8 | :ann Answer: William Shakespeare", ":ann Question 16. | !wait 1 | :ann What is the main language spoken in Brazil? | !wait 8 | :ann Answer: Portuguese", ":ann Question 17. | !wait 1 | :ann Which instrument has 88 keys? | !wait 8 | :ann Answer: Piano", ":ann Question 18. | !wait 1 | :ann What do bees produce? | !wait 8 | :ann Answer: Honey", ":ann Question 19. | !wait 1 | :ann Which bird is often associated with delivering babies in stories? | !wait 8 | :ann Answer: Stork", ":ann Question 20. | !wait 1 | :ann What is the name of Earth’s natural satellite? | !wait 8 | :ann Answer: Moon", ":ann Question 21. | !wait 1 | :ann What is the tallest animal in the world? | !wait 8 | :ann Answer: Giraffe", ":ann Question 22. | !wait 1 | :ann Which planet is closest to the Sun? | !wait 8 | :ann Answer: Mercury", ":ann Question 23. | !wait 1 | :ann What is the freezing point of water in Celsius? | !wait 8 | :ann Answer: 0 degrees", ":ann Question 24. | !wait 1 | :ann Which continent is the Sahara Desert located in? | !wait 8 | :ann Answer: Africa", ":ann Question 25. | !wait 1 | :ann What is the largest mammal in the world? | !wait 8 | :ann Answer: Blue Whale", ":ann Question 26. | !wait 1 | :ann How many days are there in a leap year? | !wait 8 | :ann Answer: 366", ":ann Question 27. | !wait 1 | :ann Which animal is famous for carrying its house on its back? | !wait 8 | :ann Answer: Turtle", ":ann Question 28. | !wait 1 | :ann What is the capital city of Japan? | !wait 8 | :ann Answer: Tokyo", ":ann Question 29. | !wait 1 | :ann What do you call a scientist who studies stars and planets? | !wait 8 | :ann Answer: Astronomer", ":ann Question 30. | !wait 1 | :ann Which fruit is known for keeping the doctor away if eaten once a day? | !wait 8 | :ann Answer: Apple", ":ann Question 31. | !wait 1 | :ann Which organ pumps blood around the human body? | !wait 8 | :ann Answer: Heart", ":ann Question 32. | !wait 1 | :ann What is the name of the fairy in Peter Pan? | !wait 8 | :ann Answer: Tinker Bell", ":ann Question 33. | !wait 1 | :ann Which country is known as the Land of the Rising Sun? | !wait 8 | :ann Answer: Japan", ":ann Question 34. | !wait 1 | :ann How many sides does a hexagon have? | !wait 8 | :ann Answer: 6", ":ann Question 35. | !wait 1 | :ann Which sea creature has eight legs? | !wait 8 | :ann Answer: Octopus", ":ann Question 36. | !wait 1 | :ann What is the main ingredient in bread? | !wait 8 | :ann Answer: Flour", ":ann Question 37. | !wait 1 | :ann Which famous ship sank in 1912 after hitting an iceberg? | !wait 8 | :ann Answer: Titanic", ":ann Question 38. | !wait 1 | :ann Which color do you get when you mix red and white? | !wait 8 | :ann Answer: Pink", ":ann Question 39. | !wait 1 | :ann What is the smallest prime number? | !wait 8 | :ann Answer: 2", ":ann Question 40. | !wait 1 | :ann Which planet has rings around it that are easily visible? | !wait 8 | :ann Answer: Saturn", ":ann Question 1. | !wait 1 | :ann Which planet is known for having the most visible rings? | !wait 8 | :ann Answer: Saturn", ":ann Question 2. | !wait 1 | :ann What is the largest type of big cat in the world? | !wait 8 | :ann Answer: Tiger", ":ann Question 3. | !wait 1 | :ann Which country is home to the Great Wall? | !wait 8 | :ann Answer: China", ":ann Question 4. | !wait 1 | :ann What is the main gas humans breathe in to survive? | !wait 8 | :ann Answer: Oxygen", ":ann Question 5. | !wait 1 | :ann Which instrument is commonly associated with pirates? | !wait 8 | :ann Answer: Accordion", ":ann Question 6. | !wait 1 | :ann How many hours are there in two days? | !wait 8 | :ann Answer: 48", ":ann Question 7. | !wait 1 | :ann Which animal is known for sleeping upside down? | !wait 8 | :ann Answer: Bat", ":ann Question 8. | !wait 1 | :ann What is the capital city of Canada? | !wait 8 | :ann Answer: Ottawa", ":ann Question 9. | !wait 1 | :ann Which famous ocean liner sank on its maiden voyage? | !wait 8 | :ann Answer: Titanic", ":ann Question 10. | !wait 1 | :ann What do caterpillars turn into? | !wait 8 | :ann Answer: Butterfly", ":ann Question 11. | !wait 1 | :ann Which planet is the hottest in our solar system? | !wait 8 | :ann Answer: Venus", ":ann Question 12. | !wait 1 | :ann What is the square root of 81? | !wait 8 | :ann Answer: 9", ":ann Question 13. | !wait 1 | :ann Which animal is known as man’s best friend? | !wait 8 | :ann Answer: Dog", ":ann Question 14. | !wait 1 | :ann Which continent is the Amazon Rainforest mostly located in? | !wait 8 | :ann Answer: South America", ":ann Question 15. | !wait 1 | :ann What is the name of the toy cowboy in Toy Story? | !wait 8 | :ann Answer: Woody", ":ann Question 16. | !wait 1 | :ann Which food is made by baking dough with toppings and cheese? | !wait 8 | :ann Answer: Pizza", ":ann Question 17. | !wait 1 | :ann Which sea animal is known for having a horn-like tusk? | !wait 8 | :ann Answer: Narwhal", ":ann Question 18. | !wait 1 | :ann What is the capital city of Spain? | !wait 8 | :ann Answer: Madrid", ":ann Question 19. | !wait 1 | :ann Which shape has three sides? | !wait 8 | :ann Answer: Triangle", ":ann Question 20. | !wait 1 | :ann What is the fastest bird in the world? | !wait 8 | :ann Answer: Peregrine Falcon", ":ann Question 21. | !wait 1 | :ann Which famous detective lives at 221B Baker Street? | !wait 8 | :ann Answer: Sherlock Holmes", ":ann Question 22. | !wait 1 | :ann What color are emeralds? | !wait 8 | :ann Answer: Green", ":ann Question 23. | !wait 1 | :ann Which planet is known as the Blue Planet? | !wait 8 | :ann Answer: Earth", ":ann Question 24. | !wait 1 | :ann What is the tallest mountain in the world? | !wait 8 | :ann Answer: Mount Everest", ":ann Question 25. | !wait 1 | :ann Which animal can spray ink as a defense mechanism? | !wait 8 | :ann Answer: Squid", ":ann Question 26. | !wait 1 | :ann Which country is famous for maple syrup? | !wait 8 | :ann Answer: Canada", ":ann Question 27. | !wait 1 | :ann How many minutes are there in one hour? | !wait 8 | :ann Answer: 60", ":ann Question 28. | !wait 1 | :ann Which famous mouse is created by Disney? | !wait 8 | :ann Answer: Mickey Mouse", ":ann Question 29. | !wait 1 | :ann Which animal is the symbol of wisdom in many cultures? | !wait 8 | :ann Answer: Owl", ":ann Question 30. | !wait 1 | :ann What is the hardest rock naturally formed on Earth? | !wait 8 | :ann Answer: Diamond", ":ann Question 31. | !wait 1 | :ann Which country has the city of Rome? | !wait 8 | :ann Answer: Italy", ":ann Question 32. | !wait 1 | :ann Which sport is played at Wimbledon? | !wait 8 | :ann Answer: Tennis", ":ann Question 33. | !wait 1 | :ann Which animal is famous for building dams? | !wait 8 | :ann Answer: Beaver", ":ann Question 34. | !wait 1 | :ann What is the name of the galaxy we live in? | !wait 8 | :ann Answer: Milky Way", ":ann Question 35. | !wait 1 | :ann Which fruit is yellow and curved? | !wait 8 | :ann Answer: Banana", ":ann Question 36. | !wait 1 | :ann Which planet takes the longest to orbit the Sun? | !wait 8 | :ann Answer: Neptune", ":ann Question 37. | !wait 1 | :ann Which animal is known for carrying babies in a pouch? | !wait 8 | :ann Answer: Kangaroo", ":ann Question 38. | !wait 1 | :ann Which country is famous for sushi? | !wait 8 | :ann Answer: Japan", ":ann Question 39. | !wait 1 | :ann What is 12 multiplied by 12? | !wait 8 | :ann Answer: 144", ":ann Question 40. | !wait 1 | :ann Which bird is known for mimicking human speech? | !wait 8 | :ann Answer: Parrot", ":ann Question 1. | !wait 1 | :ann Which animal is known for having a hump on its back? | !wait 8 | :ann Answer: Camel", ":ann Question 2. | !wait 1 | :ann What is the capital city of Brazil? | !wait 8 | :ann Answer: Brasília", ":ann Question 3. | !wait 1 | :ann Which planet is famous for being tilted on its side? | !wait 8 | :ann Answer: Uranus", ":ann Question 4. | !wait 1 | :ann What is the name of the wooden boy whose nose grows when he lies? | !wait 8 | :ann Answer: Pinocchio", ":ann Question 5. | !wait 1 | :ann Which animal is known for storing nuts for the winter? | !wait 8 | :ann Answer: Squirrel", ":ann Question 6. | !wait 1 | :ann Which country is home to the city of Athens? | !wait 8 | :ann Answer: Greece", ":ann Question 7. | !wait 1 | :ann What is 15 multiplied by 4? | !wait 8 | :ann Answer: 60", ":ann Question 8. | !wait 1 | :ann Which bird is famous for its colorful feathers and ability to mimic sounds? | !wait 8 | :ann Answer: Macaw", ":ann Question 9. | !wait 1 | :ann What is the largest planet in the solar system? | !wait 8 | :ann Answer: Jupiter", ":ann Question 10. | !wait 1 | :ann Which animal is known for building webs? | !wait 8 | :ann Answer: Spider", ":ann Question 11. | !wait 1 | :ann Which country is famous for kangaroos? | !wait 8 | :ann Answer: Australia", ":ann Question 12. | !wait 1 | :ann What is the name of the princess in Aladdin? | !wait 8 | :ann Answer: Jasmine", ":ann Question 13. | !wait 1 | :ann Which ocean is located between North America and Europe? | !wait 8 | :ann Answer: Atlantic Ocean", ":ann Question 14. | !wait 1 | :ann Which animal is known for having a shell and moving slowly? | !wait 8 | :ann Answer: Snail", ":ann Question 15. | !wait 1 | :ann Which sport uses clubs and a small white ball? | !wait 8 | :ann Answer: Golf", ":ann Question 16. | !wait 1 | :ann What is the tallest type of grass in the world? | !wait 8 | :ann Answer: Bamboo", ":ann Question 17. | !wait 1 | :ann Which country is famous for the Taj Mahal? | !wait 8 | :ann Answer: India", ":ann Question 18. | !wait 1 | :ann What is the main ingredient in guacamole? | !wait 8 | :ann Answer: Avocado", ":ann Question 19. | !wait 1 | :ann Which animal is known for changing color to blend into surroundings? | !wait 8 | :ann Answer: Chameleon", ":ann Question 20. | !wait 1 | :ann Which planet is closest in size to Earth? | !wait 8 | :ann Answer: Venus", ":ann Question 21. | !wait 1 | :ann Which famous character lives in a pineapple under the sea? | !wait 8 | :ann Answer: SpongeBob SquarePants", ":ann Question 22. | !wait 1 | :ann Which country is famous for chocolate and waffles? | !wait 8 | :ann Answer: Belgium", ":ann Question 23. | !wait 1 | :ann What do you call frozen water falling from the sky? | !wait 8 | :ann Answer: Snow", ":ann Question 24. | !wait 1 | :ann Which animal is known for its black-and-white fur and eating bamboo? | !wait 8 | :ann Answer: Panda", ":ann Question 25. | !wait 1 | :ann What is the capital city of South Korea? | !wait 8 | :ann Answer: Seoul", ":ann Question 26. | !wait 1 | :ann Which shape has eight sides? | !wait 8 | :ann Answer: Octagon", ":ann Question 27. | !wait 1 | :ann Which animal is known for having antlers? | !wait 8 | :ann Answer: Deer", ":ann Question 28. | !wait 1 | :ann What is the name of the snow queen in Frozen? | !wait 8 | :ann Answer: Elsa", ":ann Question 29. | !wait 1 | :ann Which country is famous for the Great Pyramid of Giza? | !wait 8 | :ann Answer: Egypt", ":ann Question 30. | !wait 1 | :ann Which instrument is played with a bow and strings? | !wait 8 | :ann Answer: Violin", ":ann Question 31. | !wait 1 | :ann Which animal is known for carrying heavy loads in deserts? | !wait 8 | :ann Answer: Donkey", ":ann Question 32. | !wait 1 | :ann What is the chemical symbol for silver? | !wait 8 | :ann Answer: Ag", ":ann Question 33. | !wait 1 | :ann Which country is famous for fjords and Vikings? | !wait 8 | :ann Answer: Norway", ":ann Question 34. | !wait 1 | :ann Which bird is known for being unable to fly and waddling on ice? | !wait 8 | :ann Answer: Penguin", ":ann Question 35. | !wait 1 | :ann What is the name of the fairy companion in Peter Pan? | !wait 8 | :ann Answer: Tinker Bell", ":ann Question 36. | !wait 1 | :ann Which planet is known for its giant storm called the Great Red Spot? | !wait 8 | :ann Answer: Jupiter", ":ann Question 37. | !wait 1 | :ann Which animal is known for its long sticky tongue used to catch insects? | !wait 8 | :ann Answer: Frog", ":ann Question 38. | !wait 1 | :ann Which country is famous for pasta and pizza? | !wait 8 | :ann Answer: Italy", ":ann Question 39. | !wait 1 | :ann What is 100 divided by 4? | !wait 8 | :ann Answer: 25", ":ann Question 40. | !wait 1 | :ann Which sea creature is known for having a spiral shell? | !wait 8 | :ann Answer: Nautilus", ":ann Question 1. | !wait 1 | :ann Which animal is known for having the strongest bite force of any land animal? | !wait 8 | :ann Answer: Hippopotamus", ":ann Question 2. | !wait 1 | :ann What is the capital city of Argentina? | !wait 8 | :ann Answer: Buenos Aires", ":ann Question 3. | !wait 1 | :ann Which planet is known for having the shortest day? | !wait 8 | :ann Answer: Jupiter", ":ann Question 4. | !wait 1 | :ann What is the name of the cowboy’s horse in Toy Story? | !wait 8 | :ann Answer: Bullseye", ":ann Question 5. | !wait 1 | :ann Which animal is known for slithering and shedding its skin? | !wait 8 | :ann Answer: Snake", ":ann Question 6. | !wait 1 | :ann Which country is home to the city of Dubai? | !wait 8 | :ann Answer: United Arab Emirates", ":ann Question 7. | !wait 1 | :ann What is 9 multiplied by 7? | !wait 8 | :ann Answer: 63", ":ann Question 8. | !wait 1 | :ann Which bird is famous for delivering messages in the past? | !wait 8 | :ann Answer: Pigeon", ":ann Question 9. | !wait 1 | :ann What is the name of the closest planet to Earth? | !wait 8 | :ann Answer: Venus", ":ann Question 10. | !wait 1 | :ann Which animal is known for having eight eyes? | !wait 8 | :ann Answer: Spider", ":ann Question 11. | !wait 1 | :ann Which country is famous for the ancient city of Petra? | !wait 8 | :ann Answer: Jordan", ":ann Question 12. | !wait 1 | :ann What is the name of the fish in Finding Nemo? | !wait 8 | :ann Answer: Clownfish", ":ann Question 13. | !wait 1 | :ann Which ocean is the coldest in the world? | !wait 8 | :ann Answer: Arctic Ocean", ":ann Question 14. | !wait 1 | :ann Which animal is known for having black spots and running very fast? | !wait 8 | :ann Answer: Cheetah", ":ann Question 15. | !wait 1 | :ann Which sport is played on ice with sticks and a puck? | !wait 8 | :ann Answer: Ice Hockey", ":ann Question 16. | !wait 1 | :ann What is the main ingredient in sushi rolls? | !wait 8 | :ann Answer: Rice", ":ann Question 17. | !wait 1 | :ann Which country is famous for the Christ the Redeemer statue? | !wait 8 | :ann Answer: Brazil", ":ann Question 18. | !wait 1 | :ann What do you call an animal that eats only plants? | !wait 8 | :ann Answer: Herbivore", ":ann Question 19. | !wait 1 | :ann Which animal is known for carrying its babies in a pouch? | !wait 8 | :ann Answer: Opossum", ":ann Question 20. | !wait 1 | :ann Which planet has the most moons discovered so far? | !wait 8 | :ann Answer: Saturn", ":ann Question 21. | !wait 1 | :ann What is the name of the princess in The Little Mermaid? | !wait 8 | :ann Answer: Ariel", ":ann Question 22. | !wait 1 | :ann Which country is famous for tulip fields and wooden clogs? | !wait 8 | :ann Answer: Netherlands", ":ann Question 23. | !wait 1 | :ann What is the opposite of nocturnal? | !wait 8 | :ann Answer: Diurnal", ":ann Question 24. | !wait 1 | :ann Which animal is known for having a trunk? | !wait 8 | :ann Answer: Elephant", ":ann Question 25. | !wait 1 | :ann What is the capital city of Turkey? | !wait 8 | :ann Answer: Ankara", ":ann Question 26. | !wait 1 | :ann Which shape has five sides? | !wait 8 | :ann Answer: Pentagon", ":ann Question 27. | !wait 1 | :ann Which animal is known for living in hives and making wax? | !wait 8 | :ann Answer: Bee", ":ann Question 28. | !wait 1 | :ann What is the name of the lion in The Lion King? | !wait 8 | :ann Answer: Simba", ":ann Question 29. | !wait 1 | :ann Which country is famous for the city of Bangkok? | !wait 8 | :ann Answer: Thailand", ":ann Question 30. | !wait 1 | :ann Which instrument has black and white keys and is smaller than a piano? | !wait 8 | :ann Answer: Keyboard", ":ann Question 31. | !wait 1 | :ann Which animal is known for rolling into a spiky ball? | !wait 8 | :ann Answer: Hedgehog", ":ann Question 32. | !wait 1 | :ann What is the chemical symbol for iron? | !wait 8 | :ann Answer: Fe", ":ann Question 33. | !wait 1 | :ann Which country is famous for castles and bagpipes? | !wait 8 | :ann Answer: Scotland", ":ann Question 34. | !wait 1 | :ann Which bird is known for having excellent night vision? | !wait 8 | :ann Answer: Owl", ":ann Question 35. | !wait 1 | :ann What is the name of the donkey in Shrek? | !wait 8 | :ann Answer: Donkey", ":ann Question 36. | !wait 1 | :ann Which planet is farthest from the Sun? | !wait 8 | :ann Answer: Neptune", ":ann Question 37. | !wait 1 | :ann Which animal is known for building large mud mounds? | !wait 8 | :ann Answer: Termite", ":ann Question 38. | !wait 1 | :ann Which country is famous for tacos and mariachi music? | !wait 8 | :ann Answer: Mexico", ":ann Question 39. | !wait 1 | :ann What is 14 multiplied by 6? | !wait 8 | :ann Answer: 84", ":ann Question 40. | !wait 1 | :ann Which sea creature is known for changing color and squirting ink? | !wait 8 | :ann Answer: Octopus", ":ann Question 1. | !wait 1 | :ann Which animal is known for having a black mask-like pattern around its eyes? | !wait 8 | :ann Answer: Raccoon", ":ann Question 2. | !wait 1 | :ann What is the capital city of Switzerland? | !wait 8 | :ann Answer: Bern", ":ann Question 3. | !wait 1 | :ann Which planet is known for its bright appearance in the night sky and is often called the Morning Star? | !wait 8 | :ann Answer: Venus", ":ann Question 4. | !wait 1 | :ann What is the name of the green ogre in Shrek? | !wait 8 | :ann Answer: Shrek", ":ann Question 5. | !wait 1 | :ann Which animal is known for having a long bushy tail and climbing trees? | !wait 8 | :ann Answer: Lemur", ":ann Question 6. | !wait 1 | :ann Which country is home to the city of Marrakech? | !wait 8 | :ann Answer: Morocco", ":ann Question 7. | !wait 1 | :ann What is 11 multiplied by 11? | !wait 8 | :ann Answer: 121", ":ann Question 8. | !wait 1 | :ann Which bird is famous for being a symbol of peace? | !wait 8 | :ann Answer: Dove", ":ann Question 9. | !wait 1 | :ann What is the name of the largest moon of Saturn? | !wait 8 | :ann Answer: Titan", ":ann Question 10. | !wait 1 | :ann Which animal is known for having pincers and living in the ocean? | !wait 8 | :ann Answer: Crab", ":ann Question 11. | !wait 1 | :ann Which country is famous for the city of Venice? | !wait 8 | :ann Answer: Italy", ":ann Question 12. | !wait 1 | :ann What is the name of the panda in Kung Fu Panda? | !wait 8 | :ann Answer: Po", ":ann Question 13. | !wait 1 | :ann Which ocean surrounds the Maldives? | !wait 8 | :ann Answer: Indian Ocean", ":ann Question 14. | !wait 1 | :ann Which animal is known for having quills for defense? | !wait 8 | :ann Answer: Porcupine", ":ann Question 15. | !wait 1 | :ann Which sport uses a net, rackets, and a shuttlecock? | !wait 8 | :ann Answer: Badminton", ":ann Question 16. | !wait 1 | :ann What fruit is commonly dried to make raisins? | !wait 8 | :ann Answer: Grapes", ":ann Question 17. | !wait 1 | :ann Which country is famous for the city of Istanbul? | !wait 8 | :ann Answer: Turkey", ":ann Question 18. | !wait 1 | :ann What do you call an animal that eats both plants and meat? | !wait 8 | :ann Answer: Omnivore", ":ann Question 19. | !wait 1 | :ann Which animal is known for hanging from trees using its tail? | !wait 8 | :ann Answer: Monkey", ":ann Question 20. | !wait 1 | :ann Which planet is known for having the tallest volcano in the solar system? | !wait 8 | :ann Answer: Mars", ":ann Question 21. | !wait 1 | :ann What is the name of the princess in Beauty and the Beast? | !wait 8 | :ann Answer: Belle", ":ann Question 22. | !wait 1 | :ann Which country is famous for saunas and thousands of lakes? | !wait 8 | :ann Answer: Finland", ":ann Question 23. | !wait 1 | :ann What is the term for animals active mainly at night? | !wait 8 | :ann Answer: Nocturnal", ":ann Question 24. | !wait 1 | :ann Which animal is known for having a hard shell and walking sideways? | !wait 8 | :ann Answer: Crab", ":ann Question 25. | !wait 1 | :ann What is the capital city of Portugal? | !wait 8 | :ann Answer: Lisbon", ":ann Question 26. | !wait 1 | :ann Which shape has ten sides? | !wait 8 | :ann Answer: Decagon", ":ann Question 27. | !wait 1 | :ann Which animal is known for weaving intricate webs? | !wait 8 | :ann Answer: Spider", ":ann Question 28. | !wait 1 | :ann What is the name of the cowboy in Toy Story? | !wait 8 | :ann Answer: Woody", ":ann Question 29. | !wait 1 | :ann Which country is famous for the city of Cape Town? | !wait 8 | :ann Answer: South Africa", ":ann Question 30. | !wait 1 | :ann Which instrument is commonly used in Scottish music and worn with a kilt tradition? | !wait 8 | :ann Answer: Bagpipes", ":ann Question 31. | !wait 1 | :ann Which animal is known for carrying water in desert caravans? | !wait 8 | :ann Answer: Camel", ":ann Question 32. | !wait 1 | :ann What is the chemical symbol for potassium? | !wait 8 | :ann Answer: K", ":ann Question 33. | !wait 1 | :ann Which country is famous for sushi trains and cherry blossoms? | !wait 8 | :ann Answer: Japan", ":ann Question 34. | !wait 1 | :ann Which bird is known for tapping on trees with its beak? | !wait 8 | :ann Answer: Woodpecker", ":ann Question 35. | !wait 1 | :ann What is the name of the tiger in Winnie the Pooh? | !wait 8 | :ann Answer: Tigger", ":ann Question 36. | !wait 1 | :ann Which planet is known for its icy blue appearance? | !wait 8 | :ann Answer: Uranus", ":ann Question 37. | !wait 1 | :ann Which animal is known for carrying its home on its back in the ocean? | !wait 8 | :ann Answer: Hermit Crab", ":ann Question 38. | !wait 1 | :ann Which country is famous for flamenco dancing? | !wait 8 | :ann Answer: Spain", ":ann Question 39. | !wait 1 | :ann What is 13 multiplied by 8? | !wait 8 | :ann Answer: 104", ":ann Question 40. | !wait 1 | :ann Which sea creature is known for having long tentacles and a jelly-like body? | !wait 8 | :ann Answer: Jellyfish", ":ann Question 1. | !wait 1 | :ann What is the capital city of Sweden? | !wait 8 | :ann Answer: Stockholm", ":ann Question 2. | !wait 1 | :ann Which is the largest continent on Earth? | !wait 8 | :ann Answer: Asia", ":ann Question 3. | !wait 1 | :ann What is the currency used in Japan? | !wait 8 | :ann Answer: Yen", ":ann Question 4. | !wait 1 | :ann What is the chemical formula for table salt? | !wait 8 | :ann Answer: NaCl", ":ann Question 5. | !wait 1 | :ann Who invented the telephone? | !wait 8 | :ann Answer: Alexander Graham Bell", ":ann Question 6. | !wait 1 | :ann What is the capital city of Portugal’s neighbour Spain? | !wait 8 | :ann Answer: Madrid", ":ann Question 7. | !wait 1 | :ann What is the fastest fish in the ocean? | !wait 8 | :ann Answer: Sailfish", ":ann Question 8. | !wait 1 | :ann Which musical instrument is typically played sideways and made of metal? | !wait 8 | :ann Answer: Flute", ":ann Question 9. | !wait 1 | :ann What is the largest hot desert in the world? | !wait 8 | :ann Answer: Sahara Desert", ":ann Question 10. | !wait 1 | :ann What is the tallest building in the world called? | !wait 8 | :ann Answer: Burj Khalifa", ":ann Question 11. | !wait 1 | :ann What is the main currency used in the United Kingdom? | !wait 8 | :ann Answer: Pound Sterling", ":ann Question 12. | !wait 1 | :ann What gas makes up most of the Earth’s atmosphere? | !wait 8 | :ann Answer: Nitrogen", ":ann Question 13. | !wait 1 | :ann How many bones are in the adult human body? | !wait 8 | :ann Answer: 206", ":ann Question 14. | !wait 1 | :ann What is the universal blood donor type? | !wait 8 | :ann Answer: O negative", ":ann Question 15. | !wait 1 | :ann Which planet has the strongest gravity? | !wait 8 | :ann Answer: Jupiter", ":ann Question 16. | !wait 1 | :ann What is the deepest part of the world’s oceans called? | !wait 8 | :ann Answer: Mariana Trench", ":ann Question 17. | !wait 1 | :ann What invention is considered one of the earliest major human tools for transport and machinery? | !wait 8 | :ann Answer: Wheel", ":ann Question 18. | !wait 1 | :ann Who wrote the novel Harry Potter series? | !wait 8 | :ann Answer: J.K. Rowling", ":ann Question 19. | !wait 1 | :ann What is the most widely spoken language in Russia? | !wait 8 | :ann Answer: Russian", ":ann Question 20. | !wait 1 | :ann What is the largest island in the world? | !wait 8 | :ann Answer: Greenland", ":ann Question 21. | !wait 1 | :ann Which famous painting shows a woman with a mysterious smile? | !wait 8 | :ann Answer: Mona Lisa", ":ann Question 22. | !wait 1 | :ann What is the capital city of Norway? | !wait 8 | :ann Answer: Oslo", ":ann Question 23. | !wait 1 | :ann Which continent is home to the most countries? | !wait 8 | :ann Answer: Africa", ":ann Question 24. | !wait 1 | :ann What is the name of the galaxy closest to the Milky Way? | !wait 8 | :ann Answer: Andromeda Galaxy", ":ann Question 25. | !wait 1 | :ann What is the average normal human body temperature in Celsius? | !wait 8 | :ann Answer: 37°C", ":ann Question 26. | !wait 1 | :ann Which system in the human body controls nerves and the brain? | !wait 8 | :ann Answer: Nervous system", ":ann Question 27. | !wait 1 | :ann What is the capital city of Canada? | !wait 8 | :ann Answer: Ottawa", ":ann Question 28. | !wait 1 | :ann Which country uses the currency called the US Dollar? | !wait 8 | :ann Answer: United States", ":ann Question 29. | !wait 1 | :ann What is the largest bone in the human body? | !wait 8 | :ann Answer: Femur", ":ann Question 30. | !wait 1 | :ann Which instrument is commonly used in orchestras and has a bright brass sound? | !wait 8 | :ann Answer: Trumpet", ":ann Question 31. | !wait 1 | :ann What is the longest river in the world? | !wait 8 | :ann Answer: Nile River", ":ann Question 32. | !wait 1 | :ann Which country is famous for inventing tea ceremonies? | !wait 8 | :ann Answer: Japan", ":ann Question 33. | !wait 1 | :ann What is the chemical symbol for sodium? | !wait 8 | :ann Answer: Na", ":ann Question 34. | !wait 1 | :ann What is the tallest waterfall in the world? | !wait 8 | :ann Answer: Angel Falls", ":ann Question 35. | !wait 1 | :ann Which animal is known for having the longest lifespan among mammals? | !wait 8 | :ann Answer: Bowhead whale", ":ann Question 36. | !wait 1 | :ann What is the capital city of Finland? | !wait 8 | :ann Answer: Helsinki", ":ann Question 37. | !wait 1 | :ann Which continent is known as the driest inhabited continent? | !wait 8 | :ann Answer: Australia", ":ann Question 38. | !wait 1 | :ann What is the speed of light in a vacuum approximately? | !wait 8 | :ann Answer: 299,792 km/s", ":ann Question 39. | !wait 1 | :ann What is the name of the famous space telescope launched by NASA in 1990? | !wait 8 | :ann Answer: Hubble Space Telescope", ":ann Question 40. | !wait 1 | :ann What is the largest organ system in the human body? | !wait 8 | :ann Answer: Integumentary system", ":ann Question 1. | !wait 1 | :ann What is the smallest continent on Earth? | !wait 8 | :ann Answer: Australia", ":ann Question 2. | !wait 1 | :ann What is the name of the process by which water turns into vapor? | !wait 8 | :ann Answer: Evaporation", ":ann Question 3. | !wait 1 | :ann Which planet is known as the “Evening Star”? | !wait 8 | :ann Answer: Venus", ":ann Question 4. | !wait 1 | :ann What is the capital city of Egypt? | !wait 8 | :ann Answer: Cairo", ":ann Question 5. | !wait 1 | :ann Which organ in the human body is responsible for breathing? | !wait 8 | :ann Answer: Lungs", ":ann Question 6. | !wait 1 | :ann What is the largest coral reef system in the world? | !wait 8 | :ann Answer: Great Barrier Reef", ":ann Question 7. | !wait 1 | :ann Which metal is known for being the best conductor of electricity? | !wait 8 | :ann Answer: Silver", ":ann Question 8. | !wait 1 | :ann What is the capital city of South Africa (administrative capital)? | !wait 8 | :ann Answer: Pretoria", ":ann Question 9. | !wait 1 | :ann Which animal is known for its ability to regenerate lost limbs? | !wait 8 | :ann Answer: Starfish", ":ann Question 10. | !wait 1 | :ann What is the hardest naturally occurring mineral? | !wait 8 | :ann Answer: Diamond", ":ann Question 11. | !wait 1 | :ann What is the main language spoken in Egypt today? | !wait 8 | :ann Answer: Arabic", ":ann Question 12. | !wait 1 | :ann Which gas is essential for fire to burn? | !wait 8 | :ann Answer: Oxygen", ":ann Question 13. | !wait 1 | :ann What is the capital city of Chile? | !wait 8 | :ann Answer: Santiago", ":ann Question 14. | !wait 1 | :ann Which planet has the most extreme temperature variations? | !wait 8 | :ann Answer: Mercury", ":ann Question 15. | !wait 1 | :ann What is the name of the force that pulls objects toward Earth? | !wait 8 | :ann Answer: Gravity", ":ann Question 16. | !wait 1 | :ann Which country is famous for the Acropolis? | !wait 8 | :ann Answer: Greece", ":ann Question 17. | !wait 1 | :ann What is the largest species of shark? | !wait 8 | :ann Answer: Whale shark", ":ann Question 18. | !wait 1 | :ann What is the capital city of Kenya? | !wait 8 | :ann Answer: Nairobi", ":ann Question 19. | !wait 1 | :ann Which animal is known for its black ink defense and eight arms? | !wait 8 | :ann Answer: Octopus", ":ann Question 20. | !wait 1 | :ann What is the main source of energy for Earth? | !wait 8 | :ann Answer: Sun", ":ann Question 21. | !wait 1 | :ann Which country is famous for maple syrup production? | !wait 8 | :ann Answer: Canada", ":ann Question 22. | !wait 1 | :ann What is the capital city of Thailand? | !wait 8 | :ann Answer: Bangkok", ":ann Question 23. | !wait 1 | :ann Which instrument uses strings and is typically played with fingers or a pick? | !wait 8 | :ann Answer: Guitar", ":ann Question 24. | !wait 1 | :ann What is the deepest ocean on Earth? | !wait 8 | :ann Answer: Pacific Ocean", ":ann Question 25. | !wait 1 | :ann Which animal is known for its black-and-white stripes and runs in herds? | !wait 8 | :ann Answer: Zebra", ":ann Question 26. | !wait 1 | :ann What is the capital city of India? | !wait 8 | :ann Answer: New Delhi", ":ann Question 27. | !wait 1 | :ann Which planet is known as Earth’s twin? | !wait 8 | :ann Answer: Venus", ":ann Question 28. | !wait 1 | :ann What is the name of the largest desert in the world (cold desert)? | !wait 8 | :ann Answer: Antarctica", ":ann Question 29. | !wait 1 | :ann Which animal is known for carrying its home on its back and moving slowly? | !wait 8 | :ann Answer: Snail", ":ann Question 30. | !wait 1 | :ann What is the capital city of Indonesia? | !wait 8 | :ann Answer: Jakarta", ":ann Question 31. | !wait 1 | :ann Which bird is known for its impressive mimicry of sounds? | !wait 8 | :ann Answer: Parrot", ":ann Question 32. | !wait 1 | :ann What is the chemical symbol for carbon? | !wait 8 | :ann Answer: C", ":ann Question 33. | !wait 1 | :ann Which country is famous for the city of Istanbul? | !wait 8 | :ann Answer: Turkey", ":ann Question 34. | !wait 1 | :ann What is the process of plants making food using sunlight called? | !wait 8 | :ann Answer: Photosynthesis", ":ann Question 35. | !wait 1 | :ann Which animal is known for sleeping through winter? | !wait 8 | :ann Answer: Bear", ":ann Question 36. | !wait 1 | :ann What is the capital city of Malaysia? | !wait 8 | :ann Answer: Kuala Lumpur", ":ann Question 37. | !wait 1 | :ann Which planet rotates the fastest on its axis? | !wait 8 | :ann Answer: Jupiter", ":ann Question 38. | !wait 1 | :ann What is the name of the invisible line that divides Earth into Northern and Southern Hemispheres? | !wait 8 | :ann Answer: Equator", ":ann Question 39. | !wait 1 | :ann Which animal is known for having a pouch to carry its young? | !wait 8 | :ann Answer: Kangaroo", ":ann Question 40. | !wait 1 | :ann What is the capital city of Peru? | !wait 8 | :ann Answer: Lima", ":ann Question 1. | !wait 1 | :ann What is the capital city of Iceland? | !wait 8 | :ann Answer: Reykjavik", ":ann Question 2. | !wait 1 | :ann What is the chemical symbol for copper? | !wait 8 | :ann Answer: Cu", ":ann Question 3. | !wait 1 | :ann Who was the first person to walk on the Moon? | !wait 8 | :ann Answer: Neil Armstrong", ":ann Question 4. | !wait 1 | :ann What is the largest country in the world by land area? | !wait 8 | :ann Answer: Russia", ":ann Question 5. | !wait 1 | :ann What is the smallest prime number greater than 10? | !wait 8 | :ann Answer: 11", ":ann Question 6. | !wait 1 | :ann Which organ in the human body filters blood? | !wait 8 | :ann Answer: Kidneys", ":ann Question 7. | !wait 1 | :ann What is the capital city of Switzerland? | !wait 8 | :ann Answer: Bern", ":ann Question 8. | !wait 1 | :ann Which element has the atomic number 1? | !wait 8 | :ann Answer: Hydrogen", ":ann Question 9. | !wait 1 | :ann What is the name of the process that turns liquid into gas at boiling point? | !wait 8 | :ann Answer: Vaporization", ":ann Question 10. | !wait 1 | :ann Who wrote the play Macbeth? | !wait 8 | :ann Answer: William Shakespeare", ":ann Question 11. | !wait 1 | :ann What is the capital city of New Zealand? | !wait 8 | :ann Answer: Wellington", ":ann Question 12. | !wait 1 | :ann Which gas do humans exhale when breathing out? | !wait 8 | :ann Answer: Carbon dioxide", ":ann Question 13. | !wait 1 | :ann What is the longest river in South America? | !wait 8 | :ann Answer: Amazon River", ":ann Question 14. | !wait 1 | :ann Which planet is known for its extreme dust storms? | !wait 8 | :ann Answer: Mars", ":ann Question 15. | !wait 1 | :ann What is the capital city of Denmark? | !wait 8 | :ann Answer: Copenhagen", ":ann Question 16. | !wait 1 | :ann What is the main ingredient in glass? | !wait 8 | :ann Answer: Sand", ":ann Question 17. | !wait 1 | :ann Which animal is known for having the longest neck relative to its body? | !wait 8 | :ann Answer: Giraffe", ":ann Question 18. | !wait 1 | :ann What is the capital city of South Korea? | !wait 8 | :ann Answer: Seoul", ":ann Question 19. | !wait 1 | :ann Which instrument uses reeds and is commonly found in orchestras? | !wait 8 | :ann Answer: Clarinet", ":ann Question 20. | !wait 1 | :ann What is the largest internal organ in the human body? | !wait 8 | :ann Answer: Liver", ":ann Question 21. | !wait 1 | :ann Which country is famous for the city of Cairo? | !wait 8 | :ann Answer: Egypt", ":ann Question 22. | !wait 1 | :ann What is the square root of 144? | !wait 8 | :ann Answer: 12", ":ann Question 23. | !wait 1 | :ann Which ocean is the smallest in the world? | !wait 8 | :ann Answer: Arctic Ocean", ":ann Question 24. | !wait 1 | :ann What is the capital city of Hungary? | !wait 8 | :ann Answer: Budapest", ":ann Question 25. | !wait 1 | :ann Which animal is known for producing venom through a stinger? | !wait 8 | :ann Answer: Scorpion", ":ann Question 26. | !wait 1 | :ann What is the hardest natural material known? | !wait 8 | :ann Answer: Diamond", ":ann Question 27. | !wait 1 | :ann Which country is famous for the Colosseum? | !wait 8 | :ann Answer: Italy", ":ann Question 28. | !wait 1 | :ann What is the capital city of Ireland? | !wait 8 | :ann Answer: Dublin", ":ann Question 29. | !wait 1 | :ann Which planet has the most volcanoes in the solar system? | !wait 8 | :ann Answer: Venus", ":ann Question 30. | !wait 1 | :ann What is the boiling point of water in Fahrenheit? | !wait 8 | :ann Answer: 212°F", ":ann Question 31. | !wait 1 | :ann Which animal is known for having a pouch and hopping? | !wait 8 | :ann Answer: Kangaroo", ":ann Question 32. | !wait 1 | :ann What is the capital city of Vietnam? | !wait 8 | :ann Answer: Hanoi", ":ann Question 33. | !wait 1 | :ann Which element is essential for human bones? | !wait 8 | :ann Answer: Calcium", ":ann Question 34. | !wait 1 | :ann What is the name of the process by which plants release oxygen? | !wait 8 | :ann Answer: Photosynthesis", ":ann Question 35. | !wait 1 | :ann Which animal is known for its ability to mimic human speech sounds? | !wait 8 | :ann Answer: Parrot", ":ann Question 36. | !wait 1 | :ann What is the capital city of Poland? | !wait 8 | :ann Answer: Warsaw", ":ann Question 37. | !wait 1 | :ann Which country is famous for the city of Athens? | !wait 8 | :ann Answer: Greece", ":ann Question 38. | !wait 1 | :ann What is the largest desert in Asia? | !wait 8 | :ann Answer: Arabian Desert", ":ann Question 39. | !wait 1 | :ann Which animal is known for having a strong shell and living both on land and water? | !wait 8 | :ann Answer: Turtle", ":ann Question 40. | !wait 1 | :ann What is the capital city of Romania? | !wait 8 | :ann Answer: Bucharest", ":ann Question 1. | !wait 1 | :ann What is the capital city of Portugal? | !wait 8 | :ann Answer: Lisbon", ":ann Question 2. | !wait 1 | :ann Which planet is known for its extreme cold temperatures and bluish appearance? | !wait 8 | :ann Answer: Neptune", ":ann Question 3. | !wait 1 | :ann What is the smallest bone in the human body? | !wait 8 | :ann Answer: Stapes", ":ann Question 4. | !wait 1 | :ann Which country is famous for the Great Barrier Reef? | !wait 8 | :ann Answer: Australia", ":ann Question 5. | !wait 1 | :ann What is the capital city of Morocco? | !wait 8 | :ann Answer: Rabat", ":ann Question 6. | !wait 1 | :ann Which gas makes up most of the Sun? | !wait 8 | :ann Answer: Hydrogen", ":ann Question 7. | !wait 1 | :ann What is the process called when a caterpillar turns into a butterfly? | !wait 8 | :ann Answer: Metamorphosis", ":ann Question 8. | !wait 1 | :ann Which animal is known for its ability to sleep while standing? | !wait 8 | :ann Answer: Horse", ":ann Question 9. | !wait 1 | :ann What is the capital city of Czech Republic? | !wait 8 | :ann Answer: Prague", ":ann Question 10. | !wait 1 | :ann Which metal is the lightest? | !wait 8 | :ann Answer: Lithium", ":ann Question 11. | !wait 1 | :ann What is the largest lake in the world by surface area? | !wait 8 | :ann Answer: Caspian Sea", ":ann Question 12. | !wait 1 | :ann Which country is famous for the city of Istanbul? | !wait 8 | :ann Answer: Turkey", ":ann Question 13. | !wait 1 | :ann What is the capital city of Finland? | !wait 8 | :ann Answer: Helsinki", ":ann Question 14. | !wait 1 | :ann Which animal is known for its ability to regrow its tail? | !wait 8 | :ann Answer: Lizard", ":ann Question 15. | !wait 1 | :ann What is the chemical symbol for gold? | !wait 8 | :ann Answer: Au", ":ann Question 16. | !wait 1 | :ann Which continent is known as the “Dark Continent” historically? | !wait 8 | :ann Answer: Africa", ":ann Question 17. | !wait 1 | :ann What is the capital city of Egypt? | !wait 8 | :ann Answer: Cairo", ":ann Question 18. | !wait 1 | :ann Which animal is known for producing milk for humans? | !wait 8 | :ann Answer: Cow", ":ann Question 19. | !wait 1 | :ann What is the name of the galaxy we live in? | !wait 8 | :ann Answer: Milky Way", ":ann Question 20. | !wait 1 | :ann Which instrument is commonly used in jazz music and has keys and a mouthpiece? | !wait 8 | :ann Answer: Saxophone", ":ann Question 21. | !wait 1 | :ann What is the capital city of Argentina? | !wait 8 | :ann Answer: Buenos Aires", ":ann Question 22. | !wait 1 | :ann Which animal is known for having excellent night vision and hunting mice? | !wait 8 | :ann Answer: Owl", ":ann Question 23. | !wait 1 | :ann What is the main language spoken in Brazil? | !wait 8 | :ann Answer: Portuguese", ":ann Question 24. | !wait 1 | :ann Which planet is closest to the Sun? | !wait 8 | :ann Answer: Mercury", ":ann Question 25. | !wait 1 | :ann What is the capital city of Chile? | !wait 8 | :ann Answer: Santiago", ":ann Question 26. | !wait 1 | :ann Which animal is known for its stripes and roar? | !wait 8 | :ann Answer: Tiger", ":ann Question 27. | !wait 1 | :ann What is the largest continent in the world? | !wait 8 | :ann Answer: Asia", ":ann Question 28. | !wait 1 | :ann Which country is famous for sushi and cherry blossoms? | !wait 8 | :ann Answer: Japan", ":ann Question 29. | !wait 1 | :ann What is the capital city of Greece? | !wait 8 | :ann Answer: Athens", ":ann Question 30. | !wait 1 | :ann Which animal is known for carrying its home on its back? | !wait 8 | :ann Answer: Snail", ":ann Question 31. | !wait 1 | :ann What is the chemical symbol for iron? | !wait 8 | :ann Answer: Fe", ":ann Question 32. | !wait 1 | :ann Which ocean is the largest in the world? | !wait 8 | :ann Answer: Pacific Ocean", ":ann Question 33. | !wait 1 | :ann What is the capital city of Norway? | !wait 8 | :ann Answer: Oslo", ":ann Question 34. | !wait 1 | :ann Which animal is known for building dams in rivers? | !wait 8 | :ann Answer: Beaver", ":ann Question 35. | !wait 1 | :ann What is the tallest mountain in the world? | !wait 8 | :ann Answer: Mount Everest", ":ann Question 36. | !wait 1 | :ann Which country is famous for maple syrup? | !wait 8 | :ann Answer: Canada", ":ann Question 37. | !wait 1 | :ann What is the capital city of Thailand? | !wait 8 | :ann Answer: Bangkok", ":ann Question 38. | !wait 1 | :ann Which animal is known for having a long trunk? | !wait 8 | :ann Answer: Elephant", ":ann Question 39. | !wait 1 | :ann What is the capital city of Spain? | !wait 8 | :ann Answer: Madrid", ":ann Question 40. | !wait 1 | :ann Which planet is known as the Red Planet? | !wait 8 | :ann Answer: Mars", ":ann Question 1. | !wait 1 | :ann What is the capital city of Mexico? | !wait 8 | :ann Answer: Mexico City", ":ann Question 2. | !wait 1 | :ann Which element has the chemical symbol “O”? | !wait 8 | :ann Answer: Oxygen", ":ann Question 3. | !wait 1 | :ann What is the largest planet in our solar system? | !wait 8 | :ann Answer: Jupiter", ":ann Question 4. | !wait 1 | :ann Which organ is responsible for pumping blood in the human body? | !wait 8 | :ann Answer: Heart", ":ann Question 5. | !wait 1 | :ann What is the capital city of Egypt? | !wait 8 | :ann Answer: Cairo", ":ann Question 6. | !wait 1 | :ann Which continent is the Amazon Rainforest located in? | !wait 8 | :ann Answer: South America", ":ann Question 7. | !wait 1 | :ann What is the process called when water turns into ice? | !wait 8 | :ann Answer: Freezing", ":ann Question 8. | !wait 1 | :ann Which animal is known as the largest land predator? | !wait 8 | :ann Answer: Polar Bear", ":ann Question 9. | !wait 1 | :ann What is the capital city of Germany? | !wait 8 | :ann Answer: Berlin", ":ann Question 10. | !wait 1 | :ann Which planet is known as the “Blue Planet”? | !wait 8 | :ann Answer: Earth", ":ann Question 11. | !wait 1 | :ann What is the smallest unit of life? | !wait 8 | :ann Answer: Cell", ":ann Question 12. | !wait 1 | :ann Which gas do plants release during photosynthesis? | !wait 8 | :ann Answer: Oxygen", ":ann Question 13. | !wait 1 | :ann What is the capital city of India? | !wait 8 | :ann Answer: New Delhi", ":ann Question 14. | !wait 1 | :ann Which ocean is the deepest? | !wait 8 | :ann Answer: Pacific Ocean", ":ann Question 15. | !wait 1 | :ann What is the square root of 169? | !wait 8 | :ann Answer: 13", ":ann Question 16. | !wait 1 | :ann Which animal is known for having a pouch to carry its young? | !wait 8 | :ann Answer: Kangaroo", ":ann Question 17. | !wait 1 | :ann What is the capital city of Italy? | !wait 8 | :ann Answer: Rome", ":ann Question 18. | !wait 1 | :ann Which instrument is commonly used in orchestras and has strings and a bow? | !wait 8 | :ann Answer: Violin", ":ann Question 19. | !wait 1 | :ann What is the largest desert in the world? | !wait 8 | :ann Answer: Antarctic Desert", ":ann Question 20. | !wait 1 | :ann Which country is famous for the Eiffel Tower? | !wait 8 | :ann Answer: France", ":ann Question 21. | !wait 1 | :ann What is the capital city of Japan? | !wait 8 | :ann Answer: Tokyo", ":ann Question 22. | !wait 1 | :ann Which animal is known for its black-and-white stripes? | !wait 8 | :ann Answer: Zebra", ":ann Question 23. | !wait 1 | :ann What is the main gas found in Earth’s atmosphere? | !wait 8 | :ann Answer: Nitrogen", ":ann Question 24. | !wait 1 | :ann Which planet is closest to the Sun? | !wait 8 | :ann Answer: Mercury", ":ann Question 25. | !wait 1 | :ann What is the capital city of Canada? | !wait 8 | :ann Answer: Ottawa", ":ann Question 26. | !wait 1 | :ann Which animal is known for spinning webs? | !wait 8 | :ann Answer: Spider", ":ann Question 27. | !wait 1 | :ann What is the hardest natural substance on Earth? | !wait 8 | :ann Answer: Diamond", ":ann Question 28. | !wait 1 | :ann Which country is known for maple syrup? | !wait 8 | :ann Answer: Canada", ":ann Question 29. | !wait 1 | :ann What is the capital city of Spain? | !wait 8 | :ann Answer: Madrid", ":ann Question 30. | !wait 1 | :ann Which animal is known for its long neck? | !wait 8 | :ann Answer: Giraffe", ":ann Question 31. | !wait 1 | :ann What is the boiling point of water in Celsius? | !wait 8 | :ann Answer: 100°C", ":ann Question 32. | !wait 1 | :ann Which planet has the most visible rings? | !wait 8 | :ann Answer: Saturn", ":ann Question 33. | !wait 1 | :ann What is the capital city of Brazil? | !wait 8 | :ann Answer: Brasília", ":ann Question 34. | !wait 1 | :ann Which animal is known as man’s best friend? | !wait 8 | :ann Answer: Dog", ":ann Question 35. | !wait 1 | :ann What is the largest ocean on Earth? | !wait 8 | :ann Answer: Pacific Ocean", ":ann Question 36. | !wait 1 | :ann Which country is famous for sushi? | !wait 8 | :ann Answer: Japan", ":ann Question 37. | !wait 1 | :ann What is the capital city of Australia? | !wait 8 | :ann Answer: Canberra", ":ann Question 38. | !wait 1 | :ann Which animal is known for building dams? | !wait 8 | :ann Answer: Beaver", ":ann Question 39. | !wait 1 | :ann What is 12 × 12? | !wait 8 | :ann Answer: 144", ":ann Question 40. | !wait 1 | :ann Which organ controls the human body? | !wait 8 | :ann Answer: Brain", ":ann Question 1. | !wait 1 | :ann What is the capital city of Turkey? | !wait 8 | :ann Answer: Ankara", ":ann Question 2. | !wait 1 | :ann Which planet is known for its Great Red Spot? | !wait 8 | :ann Answer: Jupiter", ":ann Question 3. | !wait 1 | :ann What is the chemical symbol for sodium? | !wait 8 | :ann Answer: Na", ":ann Question 4. | !wait 1 | :ann Which animal is known for its ability to camouflage in the ocean? | !wait 8 | :ann Answer: Octopus", ":ann Question 5. | !wait 1 | :ann What is the capital city of Sweden? | !wait 8 | :ann Answer: Stockholm", ":ann Question 6. | !wait 1 | :ann Which country is famous for the pyramids of Giza? | !wait 8 | :ann Answer: Egypt", ":ann Question 7. | !wait 1 | :ann What is the largest land animal in the world? | !wait 8 | :ann Answer: Elephant", ":ann Question 8. | !wait 1 | :ann Which ocean lies between Africa and Australia? | !wait 8 | :ann Answer: Indian Ocean", ":ann Question 9. | !wait 1 | :ann What is the capital city of Norway? | !wait 8 | :ann Answer: Oslo", ":ann Question 10. | !wait 1 | :ann Which animal is known for its black-and-white fur and eating bamboo? | !wait 8 | :ann Answer: Panda", ":ann Question 11. | !wait 1 | :ann What is the process by which plants make food using sunlight? | !wait 8 | :ann Answer: Photosynthesis", ":ann Question 12. | !wait 1 | :ann Which planet is closest to Earth in size? | !wait 8 | :ann Answer: Venus", ":ann Question 13. | !wait 1 | :ann What is the capital city of Thailand? | !wait 8 | :ann Answer: Bangkok", ":ann Question 14. | !wait 1 | :ann Which animal is known for its long trunk? | !wait 8 | :ann Answer: Elephant", ":ann Question 15. | !wait 1 | :ann What is the square root of 64? | !wait 8 | :ann Answer: 8", ":ann Question 16. | !wait 1 | :ann Which country is famous for tulips and windmills? | !wait 8 | :ann Answer: Netherlands", ":ann Question 17. | !wait 1 | :ann What is the capital city of India? | !wait 8 | :ann Answer: New Delhi", ":ann Question 18. | !wait 1 | :ann Which animal is known for building intricate webs? | !wait 8 | :ann Answer: Spider", ":ann Question 19. | !wait 1 | :ann What is the largest desert in the world? | !wait 8 | :ann Answer: Antarctic Desert", ":ann Question 20. | !wait 1 | :ann Which gas do humans breathe in to survive? | !wait 8 | :ann Answer: Oxygen", ":ann Question 21. | !wait 1 | :ann What is the capital city of France? | !wait 8 | :ann Answer: Paris", ":ann Question 22. | !wait 1 | :ann Which animal is known for its stripes and speed? | !wait 8 | :ann Answer: Cheetah", ":ann Question 23. | !wait 1 | :ann What is the largest planet in the solar system? | !wait 8 | :ann Answer: Jupiter", ":ann Question 24. | !wait 1 | :ann Which country is known for pizza and pasta? | !wait 8 | :ann Answer: Italy", ":ann Question 25. | !wait 1 | :ann What is the capital city of Mexico? | !wait 8 | :ann Answer: Mexico City", ":ann Question 26. | !wait 1 | :ann Which bird is known for mimicking human speech? | !wait 8 | :ann Answer: Parrot", ":ann Question 27. | !wait 1 | :ann What is the boiling point of water in Fahrenheit? | !wait 8 | :ann Answer: 212°F", ":ann Question 28. | !wait 1 | :ann Which animal is known for carrying its babies in a pouch? | !wait 8 | :ann Answer: Kangaroo", ":ann Question 29. | !wait 1 | :ann What is the capital city of Greece? | !wait 8 | :ann Answer: Athens", ":ann Question 30. | !wait 1 | :ann Which instrument has keys and is commonly used in classical music? | !wait 8 | :ann Answer: Piano", ":ann Question 31. | !wait 1 | :ann What is the longest river in the world? | !wait 8 | :ann Answer: Nile River", ":ann Question 32. | !wait 1 | :ann Which animal is known for its shell and slow movement? | !wait 8 | :ann Answer: Snail", ":ann Question 33. | !wait 1 | :ann What is the capital city of Russia? | !wait 8 | :ann Answer: Moscow", ":ann Question 34. | !wait 1 | :ann Which country is famous for chocolate and waffles? | !wait 8 | :ann Answer: Belgium", ":ann Question 35. | !wait 1 | :ann What is the chemical symbol for iron? | !wait 8 | :ann Answer: Fe", ":ann Question 36. | !wait 1 | :ann Which planet is known as the Red Planet? | !wait 8 | :ann Answer: Mars", ":ann Question 37. | !wait 1 | :ann What is the capital city of South Korea? | !wait 8 | :ann Answer: Seoul", ":ann Question 38. | !wait 1 | :ann Which animal is known for its ability to sleep through winter? | !wait 8 | :ann Answer: Bear", ":ann Question 39. | !wait 1 | :ann What is 9 × 9? | !wait 8 | :ann Answer: 81", ":ann Question 40. | !wait 1 | :ann Which ocean is the largest on Earth? | !wait 8 | :ann Answer: Pacific Ocean", ":ann Question 1. | !wait 1 | :ann What is the capital city of Egypt? | !wait 8 | :ann Answer: Cairo", ":ann Question 2. | !wait 1 | :ann Which planet is known for its extreme winds and blue colour? | !wait 8 | :ann Answer: Neptune", ":ann Question 3. | !wait 1 | :ann What is the chemical symbol for potassium? | !wait 8 | :ann Answer: K", ":ann Question 4. | !wait 1 | :ann Which animal is known for its ability to change colour rapidly? | !wait 8 | :ann Answer: Chameleon", ":ann Question 5. | !wait 1 | :ann What is the capital city of Argentina? | !wait 8 | :ann Answer: Buenos Aires", ":ann Question 6. | !wait 1 | :ann Which country is famous for sushi and cherry blossoms? | !wait 8 | :ann Answer: Japan", ":ann Question 7. | !wait 1 | :ann What is the largest mammal in the world? | !wait 8 | :ann Answer: Blue whale", ":ann Question 8. | !wait 1 | :ann Which ocean is the smallest on Earth? | !wait 8 | :ann Answer: Arctic Ocean", ":ann Question 9. | !wait 1 | :ann What is the capital city of Poland? | !wait 8 | :ann Answer: Warsaw", ":ann Question 10. | !wait 1 | :ann Which animal is known for having a very long neck and eating leaves from trees? | !wait 8 | :ann Answer: Giraffe", ":ann Question 11. | !wait 1 | :ann What is the smallest planet in the solar system? | !wait 8 | :ann Answer: Mercury", ":ann Question 12. | !wait 1 | :ann Which country is famous for the Eiffel Tower? | !wait 8 | :ann Answer: France", ":ann Question 13. | !wait 1 | :ann What is the capital city of China? | !wait 8 | :ann Answer: Beijing", ":ann Question 14. | !wait 1 | :ann Which animal is known for building dams in rivers? | !wait 8 | :ann Answer: Beaver", ":ann Question 15. | !wait 1 | :ann What is 7 × 8? | !wait 8 | :ann Answer: 56", ":ann Question 16. | !wait 1 | :ann Which instrument is commonly used in jazz music and has a brass sound? | !wait 8 | :ann Answer: Saxophone", ":ann Question 17. | !wait 1 | :ann What is the capital city of Vietnam? | !wait 8 | :ann Answer: Hanoi", ":ann Question 18. | !wait 1 | :ann Which animal is known for having black and white stripes and living in herds? | !wait 8 | :ann Answer: Zebra", ":ann Question 19. | !wait 1 | :ann What is the main gas in Earth’s atmosphere? | !wait 8 | :ann Answer: Nitrogen", ":ann Question 20. | !wait 1 | :ann Which planet is closest to the Sun? | !wait 8 | :ann Answer: Mercury", ":ann Question 21. | !wait 1 | :ann What is the capital city of Spain? | !wait 8 | :ann Answer: Madrid", ":ann Question 22. | !wait 1 | :ann Which animal is known for spinning webs to catch insects? | !wait 8 | :ann Answer: Spider", ":ann Question 23. | !wait 1 | :ann What is the hardest natural substance on Earth? | !wait 8 | :ann Answer: Diamond", ":ann Question 24. | !wait 1 | :ann Which country is famous for maple syrup? | !wait 8 | :ann Answer: Canada", ":ann Question 25. | !wait 1 | :ann What is the capital city of Turkey? | !wait 8 | :ann Answer: Ankara", ":ann Question 26. | !wait 1 | :ann Which animal is known for having a trunk? | !wait 8 | :ann Answer: Elephant", ":ann Question 27. | !wait 1 | :ann What is the boiling point of water in Celsius? | !wait 8 | :ann Answer: 100°C", ":ann Question 28. | !wait 1 | :ann Which country is known for pasta and pizza? | !wait 8 | :ann Answer: Italy", ":ann Question 29. | !wait 1 | :ann What is the capital city of Australia? | !wait 8 | :ann Answer: Canberra", ":ann Question 30. | !wait 1 | :ann Which animal is known for its pouch and hopping movement? | !wait 8 | :ann Answer: Kangaroo", ":ann Question 31. | !wait 1 | :ann What is the capital city of Romania? | !wait 8 | :ann Answer: Bucharest", ":ann Question 32. | !wait 1 | :ann Which planet has rings visible from Earth? | !wait 8 | :ann Answer: Saturn", ":ann Question 33. | !wait 1 | :ann What is the square root of 121? | !wait 8 | :ann Answer: 11", ":ann Question 34. | !wait 1 | :ann Which animal is known for its black-and-white fur and eating bamboo? | !wait 8 | :ann Answer: Panda", ":ann Question 35. | !wait 1 | :ann What is the capital city of India? | !wait 8 | :ann Answer: New Delhi", ":ann Question 36. | !wait 1 | :ann Which ocean is the largest in the world? | !wait 8 | :ann Answer: Pacific Ocean", ":ann Question 37. | !wait 1 | :ann What is the chemical symbol for gold? | !wait 8 | :ann Answer: Au", ":ann Question 38. | !wait 1 | :ann Which animal is known for its sharp eyesight and hunting mice at night? | !wait 8 | :ann Answer: Owl", ":ann Question 39. | !wait 1 | :ann What is the capital city of Greece? | !wait 8 | :ann Answer: Athens", ":ann Question 40. | !wait 1 | :ann Which planet is known as the Red Planet? | !wait 8 | :ann Answer: Mars", ":ann Question 1. | !wait 1 | :ann What is the capital city of Portugal? | !wait 8 | :ann Answer: Lisbon", ":ann Question 2. | !wait 1 | :ann Which planet is known for having the most extreme temperature differences between day and night? | !wait 8 | :ann Answer: Mercury", ":ann Question 3. | !wait 1 | :ann What is the chemical symbol for silver? | !wait 8 | :ann Answer: Ag", ":ann Question 4. | !wait 1 | :ann Which animal is known for living in icy regions and having a thick layer of blubber? | !wait 8 | :ann Answer: Seal", ":ann Question 5. | !wait 1 | :ann What is the capital city of Kenya? | !wait 8 | :ann Answer: Nairobi", ":ann Question 6. | !wait 1 | :ann Which country is famous for the city of Rio de Janeiro? | !wait 8 | :ann Answer: Brazil", ":ann Question 7. | !wait 1 | :ann What is the process called when liquid water turns into gas below boiling point? | !wait 8 | :ann Answer: Evaporation", ":ann Question 8. | !wait 1 | :ann Which animal is known for its ability to glide from tree to tree? | !wait 8 | :ann Answer: Flying squirrel", ":ann Question 9. | !wait 1 | :ann What is the capital city of Netherlands? | !wait 8 | :ann Answer: Amsterdam", ":ann Question 10. | !wait 1 | :ann Which planet is known as the “Gas Giant with Rings”? | !wait 8 | :ann Answer: Saturn", ":ann Question 11. | !wait 1 | :ann What is the largest internal organ in the human body? | !wait 8 | :ann Answer: Liver", ":ann Question 12. | !wait 1 | :ann Which animal is known for building intricate dams in rivers? | !wait 8 | :ann Answer: Beaver", ":ann Question 13. | !wait 1 | :ann What is the capital city of Switzerland? | !wait 8 | :ann Answer: Bern", ":ann Question 14. | !wait 1 | :ann Which country is famous for the Great Wall? | !wait 8 | :ann Answer: China", ":ann Question 15. | !wait 1 | :ann What is the square root of 196? | !wait 8 | :ann Answer: 14", ":ann Question 16. | !wait 1 | :ann Which animal is known for its pouch and carrying joeys? | !wait 8 | :ann Answer: Kangaroo", ":ann Question 17. | !wait 1 | :ann What is the capital city of Chile? | !wait 8 | :ann Answer: Santiago", ":ann Question 18. | !wait 1 | :ann Which instrument is commonly used in orchestras and has black and white keys? | !wait 8 | :ann Answer: Piano", ":ann Question 19. | !wait 1 | :ann What is the largest desert in the world (cold desert)? | !wait 8 | :ann Answer: Antarctica", ":ann Question 20. | !wait 1 | :ann Which gas do humans breathe in to survive? | !wait 8 | :ann Answer: Oxygen", ":ann Question 21. | !wait 1 | :ann What is the capital city of Italy? | !wait 8 | :ann Answer: Rome", ":ann Question 22. | !wait 1 | :ann Which animal is known for its stripes and powerful roar? | !wait 8 | :ann Answer: Tiger", ":ann Question 23. | !wait 1 | :ann What is the largest continent on Earth? | !wait 8 | :ann Answer: Asia", ":ann Question 24. | !wait 1 | :ann Which country is famous for sushi? | !wait 8 | :ann Answer: Japan", ":ann Question 25. | !wait 1 | :ann What is the capital city of Mexico? | !wait 8 | :ann Answer: Mexico City", ":ann Question 26. | !wait 1 | :ann Which animal is known for its ability to mimic human speech? | !wait 8 | :ann Answer: Parrot", ":ann Question 27. | !wait 1 | :ann What is the boiling point of water in Kelvin? | !wait 8 | :ann Answer: 373 K", ":ann Question 28. | !wait 1 | :ann Which ocean is the smallest on Earth? | !wait 8 | :ann Answer: Arctic Ocean", ":ann Question 29. | !wait 1 | :ann What is the capital city of Sweden? | !wait 8 | :ann Answer: Stockholm", ":ann Question 30. | !wait 1 | :ann Which animal is known for its black-and-white stripes and social herds? | !wait 8 | :ann Answer: Zebra", ":ann Question 31. | !wait 1 | :ann What is the chemical symbol for iron? | !wait 8 | :ann Answer: Fe", ":ann Question 32. | !wait 1 | :ann Which planet is closest to the Sun? | !wait 8 | :ann Answer: Mercury", ":ann Question 33. | !wait 1 | :ann What is the capital city of South Africa (administrative capital)? | !wait 8 | :ann Answer: Pretoria", ":ann Question 34. | !wait 1 | :ann Which animal is known for spinning complex webs to trap prey? | !wait 8 | :ann Answer: Spider", ":ann Question 35. | !wait 1 | :ann What is the main gas found in Earth’s atmosphere? | !wait 8 | :ann Answer: Nitrogen", ":ann Question 36. | !wait 1 | :ann What is the capital city of Germany? | !wait 8 | :ann Answer: Berlin", ":ann Question 37. | !wait 1 | :ann Which animal is known for having a long neck used to reach treetops? | !wait 8 | :ann Answer: Giraffe", ":ann Question 38. | !wait 1 | :ann What is 16 × 6? | !wait 8 | :ann Answer: 96", ":ann Question 39. | !wait 1 | :ann Which planet is known for its red dusty surface? | !wait 8 | :ann Answer: Mars", ":ann Question 40. | !wait 1 | :ann What is the capital city of Australia? | !wait 8 | :ann Answer: Canberra", ":ann Question 1. | !wait 1 | :ann What is the capital city of Norway? | !wait 8 | :ann Answer: Oslo", ":ann Question 2. | !wait 1 | :ann Which planet is known for having the longest year (slowest orbit around the Sun)? | !wait 8 | :ann Answer: Neptune", ":ann Question 3. | !wait 1 | :ann What is the chemical symbol for calcium? | !wait 8 | :ann Answer: Ca", ":ann Question 4. | !wait 1 | :ann Which animal is known for having a pouch and being native to Australia? | !wait 8 | :ann Answer: Kangaroo", ":ann Question 5. | !wait 1 | :ann What is the capital city of Finland? | !wait 8 | :ann Answer: Helsinki", ":ann Question 6. | !wait 1 | :ann Which country is famous for the city of Cairo? | !wait 8 | :ann Answer: Egypt", ":ann Question 7. | !wait 1 | :ann What is the process called when plants lose water through their leaves? | !wait 8 | :ann Answer: Transpiration", ":ann Question 8. | !wait 1 | :ann Which animal is known for having eight legs and spinning webs? | !wait 8 | :ann Answer: Spider", ":ann Question 9. | !wait 1 | :ann What is the capital city of Ireland? | !wait 8 | :ann Answer: Dublin", ":ann Question 10. | !wait 1 | :ann Which planet is known for its strong winds and blue-green colour? | !wait 8 | :ann Answer: Uranus", ":ann Question 11. | !wait 1 | :ann What is the largest bone in the human body? | !wait 8 | :ann Answer: Femur", ":ann Question 12. | !wait 1 | :ann Which animal is known for building nests and producing honey? | !wait 8 | :ann Answer: Bee", ":ann Question 13. | !wait 1 | :ann What is the capital city of Denmark? | !wait 8 | :ann Answer: Copenhagen", ":ann Question 14. | !wait 1 | :ann Which country is famous for the city of Athens? | !wait 8 | :ann Answer: Greece", ":ann Question 15. | !wait 1 | :ann What is 18 × 5? | !wait 8 | :ann Answer: 90", ":ann Question 16. | !wait 1 | :ann Which instrument is made of wood or metal and is commonly used in orchestras for high notes? | !wait 8 | :ann Answer: Flute", ":ann Question 17. | !wait 1 | :ann What is the capital city of Poland? | !wait 8 | :ann Answer: Warsaw", ":ann Question 18. | !wait 1 | :ann Which animal is known for its black-and-white fur and eating bamboo? | !wait 8 | :ann Answer: Panda", ":ann Question 19. | !wait 1 | :ann What is the largest ocean on Earth? | !wait 8 | :ann Answer: Pacific Ocean", ":ann Question 20. | !wait 1 | :ann Which gas do humans exhale when breathing out? | !wait 8 | :ann Answer: Carbon dioxide", ":ann Question 21. | !wait 1 | :ann What is the capital city of Spain? | !wait 8 | :ann Answer: Madrid", ":ann Question 22. | !wait 1 | :ann Which animal is known for its long trunk? | !wait 8 | :ann Answer: Elephant", ":ann Question 23. | !wait 1 | :ann What is the chemical symbol for gold? | !wait 8 | :ann Answer: Au", ":ann Question 24. | !wait 1 | :ann Which planet is closest in size to Earth? | !wait 8 | :ann Answer: Venus", ":ann Question 25. | !wait 1 | :ann What is the capital city of Portugal? | !wait 8 | :ann Answer: Lisbon", ":ann Question 26. | !wait 1 | :ann Which animal is known for its ability to change colour? | !wait 8 | :ann Answer: Chameleon", ":ann Question 27. | !wait 1 | :ann What is the square root of 225? | !wait 8 | :ann Answer: 15", ":ann Question 28. | !wait 1 | :ann Which country is famous for the Eiffel Tower? | !wait 8 | :ann Answer: France", ":ann Question 29. | !wait 1 | :ann What is the capital city of Egypt? | !wait 8 | :ann Answer: Cairo", ":ann Question 30. | !wait 1 | :ann Which animal is known for its shell and slow movement? | !wait 8 | :ann Answer: Snail", ":ann Question 31. | !wait 1 | :ann What is the main language spoken in Japan? | !wait 8 | :ann Answer: Japanese", ":ann Question 32. | !wait 1 | :ann Which planet is known as the “Blue Planet”? | !wait 8 | :ann Answer: Earth", ":ann Question 33. | !wait 1 | :ann What is the capital city of Switzerland? | !wait 8 | :ann Answer: Bern", ":ann Question 34. | !wait 1 | :ann Which animal is known for its stripes and speed? | !wait 8 | :ann Answer: Cheetah", ":ann Question 35. | !wait 1 | :ann What is the boiling point of water in Celsius? | !wait 8 | :ann Answer: 100°C", ":ann Question 36. | !wait 1 | :ann Which country is famous for maple syrup? | !wait 8 | :ann Answer: Canada", ":ann Question 37. | !wait 1 | :ann What is the capital city of Thailand? | !wait 8 | :ann Answer: Bangkok", ":ann Question 38. | !wait 1 | :ann Which animal is known for building dams in rivers? | !wait 8 | :ann Answer: Beaver", ":ann Question 39. | !wait 1 | :ann What is the smallest continent on Earth? | !wait 8 | :ann Answer: Australia", ":ann Question 40. | !wait 1 | :ann Which planet is known for its iconic rings? | !wait 8 | :ann Answer: Saturn", ":ann Question 1. | !wait 1 | :ann What is the capital city of Belgium? | !wait 8 | :ann Answer: Brussels", ":ann Question 2. | !wait 1 | :ann Which planet is known as the “Morning Star” when visible in the sky? | !wait 8 | :ann Answer: Venus", ":ann Question 3. | !wait 1 | :ann What is the chemical symbol for hydrogen? | !wait 8 | :ann Answer: H", ":ann Question 4. | !wait 1 | :ann Which animal is known for its ability to hibernate through winter? | !wait 8 | :ann Answer: Bear", ":ann Question 5. | !wait 1 | :ann What is the capital city of Austria? | !wait 8 | :ann Answer: Vienna", ":ann Question 6. | !wait 1 | :ann Which country is famous for the Taj Mahal? | !wait 8 | :ann Answer: India", ":ann Question 7. | !wait 1 | :ann What is the process called when a solid turns directly into a gas? | !wait 8 | :ann Answer: Sublimation", ":ann Question 8. | !wait 1 | :ann Which animal is known for having a pouch and climbing trees? | !wait 8 | :ann Answer: Koala", ":ann Question 9. | !wait 1 | :ann What is the capital city of Hungary? | !wait 8 | :ann Answer: Budapest", ":ann Question 10. | !wait 1 | :ann Which planet is known for its massive storms and red appearance? | !wait 8 | :ann Answer: Mars", ":ann Question 11. | !wait 1 | :ann What is the largest organ in the human body? | !wait 8 | :ann Answer: Skin", ":ann Question 12. | !wait 1 | :ann Which animal is known for producing venom and having a stinger? | !wait 8 | :ann Answer: Scorpion", ":ann Question 13. | !wait 1 | :ann What is the capital city of Czech Republic? | !wait 8 | :ann Answer: Prague", ":ann Question 14. | !wait 1 | :ann Which country is famous for sushi and anime culture? | !wait 8 | :ann Answer: Japan", ":ann Question 15. | !wait 1 | :ann What is 14 × 7? | !wait 8 | :ann Answer: 98", ":ann Question 16. | !wait 1 | :ann Which instrument is commonly used in rock music and has strings? | !wait 8 | :ann Answer: Electric guitar", ":ann Question 17. | !wait 1 | :ann What is the capital city of Peru? | !wait 8 | :ann Answer: Lima", ":ann Question 18. | !wait 1 | :ann Which animal is known for its black-and-white stripes and fast running speed? | !wait 8 | :ann Answer: Zebra", ":ann Question 19. | !wait 1 | :ann What is the main gas used in photosynthesis? | !wait 8 | :ann Answer: Carbon dioxide", ":ann Question 20. | !wait 1 | :ann Which planet is closest to the Sun? | !wait 8 | :ann Answer: Mercury", ":ann Question 21. | !wait 1 | :ann What is the capital city of Sweden? | !wait 8 | :ann Answer: Stockholm", ":ann Question 22. | !wait 1 | :ann Which animal is known for its ability to swing through trees? | !wait 8 | :ann Answer: Monkey", ":ann Question 23. | !wait 1 | :ann What is the chemical symbol for oxygen? | !wait 8 | :ann Answer: O", ":ann Question 24. | !wait 1 | :ann Which planet has the most moons? | !wait 8 | :ann Answer: Saturn", ":ann Question 25. | !wait 1 | :ann What is the capital city of Egypt? | !wait 8 | :ann Answer: Cairo", ":ann Question 26. | !wait 1 | :ann Which animal is known for carrying its home on its back? | !wait 8 | :ann Answer: Snail", ":ann Question 27. | !wait 1 | :ann What is the square root of 256? | !wait 8 | :ann Answer: 16", ":ann Question 28. | !wait 1 | :ann Which country is famous for the Statue of Liberty gift? | !wait 8 | :ann Answer: France", ":ann Question 29. | !wait 1 | :ann What is the capital city of Greece? | !wait 8 | :ann Answer: Athens", ":ann Question 30. | !wait 1 | :ann Which animal is known for building dams in rivers? | !wait 8 | :ann Answer: Beaver", ":ann Question 31. | !wait 1 | :ann What is the capital city of South Korea? | !wait 8 | :ann Answer: Seoul", ":ann Question 32. | !wait 1 | :ann Which planet is known for its tilted rotation axis causing extreme seasons? | !wait 8 | :ann Answer: Uranus", ":ann Question 33. | !wait 1 | :ann What is the boiling point of water in Fahrenheit? | !wait 8 | :ann Answer: 212°F", ":ann Question 34. | !wait 1 | :ann Which animal is known for its sharp eyesight and hunting at night? | !wait 8 | :ann Answer: Owl", ":ann Question 35. | !wait 1 | :ann What is the capital city of Argentina? | !wait 8 | :ann Answer: Buenos Aires", ":ann Question 36. | !wait 1 | :ann Which country is famous for chocolate and waffles? | !wait 8 | :ann Answer: Belgium", ":ann Question 37. | !wait 1 | :ann What is the chemical symbol for iron? | !wait 8 | :ann Answer: Fe", ":ann Question 38. | !wait 1 | :ann Which animal is known for its long neck and eating leaves from trees? | !wait 8 | :ann Answer: Giraffe", ":ann Question 39. | !wait 1 | :ann What is the capital city of Mexico? | !wait 8 | :ann Answer: Mexico City", ":ann Question 40. | !wait 1 | :ann Which planet is known as the Red Planet? | !wait 8 | :ann Answer: Mars", ":ann Question 1. | !wait 1 | :ann What is the capital city of Iceland? | !wait 8 | :ann Answer: Reykjavik", ":ann Question 2. | !wait 1 | :ann Which planet is known as the “Blue Planet” due to its oceans? | !wait 8 | :ann Answer: Earth", ":ann Question 3. | !wait 1 | :ann What is the chemical symbol for magnesium? | !wait 8 | :ann Answer: Mg", ":ann Question 4. | !wait 1 | :ann Which animal is known for its ability to hang upside down while sleeping? | !wait 8 | :ann Answer: Bat", ":ann Question 5. | !wait 1 | :ann What is the capital city of Croatia? | !wait 8 | :ann Answer: Zagreb", ":ann Question 6. | !wait 1 | :ann Which country is famous for the city of Bangkok? | !wait 8 | :ann Answer: Thailand", ":ann Question 7. | !wait 1 | :ann What is the process called when plants convert sunlight into energy? | !wait 8 | :ann Answer: Photosynthesis", ":ann Question 8. | !wait 1 | :ann Which animal is known for having the strongest bite force? | !wait 8 | :ann Answer: Crocodile", ":ann Question 9. | !wait 1 | :ann What is the capital city of Switzerland? | !wait 8 | :ann Answer: Bern", ":ann Question 10. | !wait 1 | :ann Which planet has the most intense dust storms in the solar system? | !wait 8 | :ann Answer: Mars", ":ann Question 11. | !wait 1 | :ann What is the largest landlocked country in the world? | !wait 8 | :ann Answer: Kazakhstan", ":ann Question 12. | !wait 1 | :ann Which animal is known for its black ink defense mechanism? | !wait 8 | :ann Answer: Squid", ":ann Question 13. | !wait 1 | :ann What is the capital city of Ukraine? | !wait 8 | :ann Answer: Kyiv", ":ann Question 14. | !wait 1 | :ann Which element has the atomic number 6? | !wait 8 | :ann Answer: Carbon", ":ann Question 15. | !wait 1 | :ann What is the tallest animal on Earth? | !wait 8 | :ann Answer: Giraffe", ":ann Question 16. | !wait 1 | :ann Which country is famous for the city of Moscow? | !wait 8 | :ann Answer: Russia", ":ann Question 17. | !wait 1 | :ann What is the capital city of Portugal? | !wait 8 | :ann Answer: Lisbon", ":ann Question 18. | !wait 1 | :ann Which animal is known for storing nuts for winter? | !wait 8 | :ann Answer: Squirrel", ":ann Question 19. | !wait 1 | :ann What is the square root of 289? | !wait 8 | :ann Answer: 17", ":ann Question 20. | !wait 1 | :ann Which ocean is the warmest on average? | !wait 8 | :ann Answer: Indian Ocean", ":ann Question 21. | !wait 1 | :ann What is the capital city of Malaysia? | !wait 8 | :ann Answer: Kuala Lumpur", ":ann Question 22. | !wait 1 | :ann Which animal is known for its ability to change skin colour for camouflage? | !wait 8 | :ann Answer: Chameleon", ":ann Question 23. | !wait 1 | :ann What is the chemical symbol for tin? | !wait 8 | :ann Answer: Sn", ":ann Question 24. | !wait 1 | :ann Which planet is known for having the longest day (slow rotation)? | !wait 8 | :ann Answer: Venus", ":ann Question 25. | !wait 1 | :ann What is the capital city of Egypt? | !wait 8 | :ann Answer: Cairo", ":ann Question 26. | !wait 1 | :ann Which animal is known for its ability to survive in deserts without water for long periods? | !wait 8 | :ann Answer: Camel", ":ann Question 27. | !wait 1 | :ann What is the boiling point of water at sea level in Kelvin? | !wait 8 | :ann Answer: 373 K", ":ann Question 28. | !wait 1 | :ann Which country is famous for the city of Rio de Janeiro? | !wait 8 | :ann Answer: Brazil", ":ann Question 29. | !wait 1 | :ann What is the capital city of Norway? | !wait 8 | :ann Answer: Oslo", ":ann Question 30. | !wait 1 | :ann Which animal is known for spinning symmetrical webs? | !wait 8 | :ann Answer: Spider", ":ann Question 31. | !wait 1 | :ann What is the main gas in the Sun? | !wait 8 | :ann Answer: Hydrogen", ":ann Question 32. | !wait 1 | :ann Which continent is the driest on Earth? | !wait 8 | :ann Answer: Antarctica", ":ann Question 33. | !wait 1 | :ann What is the capital city of Canada? | !wait 8 | :ann Answer: Ottawa", ":ann Question 34. | !wait 1 | :ann Which animal is known for its black-and-white stripes and horse-like body? | !wait 8 | :ann Answer: Zebra", ":ann Question 35. | !wait 1 | :ann What is the chemical symbol for potassium? | !wait 8 | :ann Answer: K", ":ann Question 36. | !wait 1 | :ann Which planet is known as Earth’s “twin” in size? | !wait 8 | :ann Answer: Venus", ":ann Question 37. | !wait 1 | :ann What is the capital city of Peru? | !wait 8 | :ann Answer: Lima", ":ann Question 38. | !wait 1 | :ann Which animal is known for its loud roar and being a big cat? | !wait 8 | :ann Answer: Lion", ":ann Question 39. | !wait 1 | :ann What is 15 × 6? | !wait 8 | :ann Answer: 90", ":ann Question 40. | !wait 1 | :ann Which planet is known for its large visible rings? | !wait 8 | :ann Answer: Saturn"];
function genTrivia() {
  var cat = g('tg-cat').value;
  if (cat === 'Trivia bank (640)') {
    var usedB = TRIVIA_USED[cat] || (TRIVIA_USED[cat] = []);
    var leftB = TRIVIA_FULL_BANK.map(function (l, i) { return i; }).filter(function (i) { return usedB.indexOf(i) === -1; });
    if (!leftB.length) { usedB.length = 0; leftB = TRIVIA_FULL_BANK.map(function (l, i) { return i; }); }
    var pickB = leftB[Math.floor(Math.random() * leftB.length)];
    usedB.push(pickB);
    g('tg-out').value = TRIVIA_FULL_BANK[pickB];
    return;
  }
  var pool = TRIVIA_BANK[cat] || [];
  var used = TRIVIA_USED[cat] || (TRIVIA_USED[cat] = []);
  var left = pool.map(function (q, i) { return i; }).filter(function (i) { return used.indexOf(i) === -1; });
  if (!pool.length) { g('tg-out').value = 'No questions in this category.'; return; }
  if (!left.length) { used.length = 0; left = pool.map(function (q, i) { return i; }); }
  var pick = left[Math.floor(Math.random() * left.length)];
  used.push(pick);
  var q = pool[pick];
  g('tg-out').value = ':ann Trivia time! ' + q[0] + '\n:ann Answer: ' + q[1];
}
// ── PERMISSIONS (Supabase; admin only) ──
var PERM_URL = 'https://ljhypfzqkllmrjfxthec.supabase.co';
var PERM_KEY = 'sb_publishable_EFtZpise7fQgnEXPJQf1sA_AN9wZDxI';
var PERM_ADMIN_ID = '1327108083281035325';
var PERM_TABS = [['flight','Flight Tool'],['cc','Cabin Crew'],['ss','Safety & Security'],['briefing','Briefing'],['cohost','Co-Host'],['atc','ATC'],['gc','Ground Crew'],['routeinfo','Route Info'],['fleet','Fleet'],['charts','Charts'],['greet','Greetings'],['suggest','Suggestions'],['pf','Private Flight'],['roles','Roles']];
var permSb = null;
function permClient() {
  if (permSb) return permSb;
  if (!window.supabase) throw new Error('Supabase did not load. Use the GitHub Pages copy of the tool.');
  permSb = window.supabase.createClient(PERM_URL, PERM_KEY);
  return permSb;
}
function permMsg(t) { var m = g('perm-msg'); if (m) m.textContent = t; }
function permBuildBoxes(sel) {
  g('perm-boxes').innerHTML = PERM_TABS.map(function (t) {
    return '<label style="display:flex;gap:6px;align-items:center;font-size:.82rem"><input type="checkbox" value="' + t[0] + '"' + ((sel || []).indexOf(t[0]) !== -1 ? ' checked' : '') + '> ' + t[1] + '</label>';
  }).join('');
}
async function permSignIn() {
  try {
    var r = await permClient().auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: location.href.split('#')[0] } });
    if (r.error) permMsg(r.error.message);
  } catch (e) { permMsg(e.message); }
}
async function permCheck() {
  var s = await permClient().auth.getSession();
  var u = s.data.session && s.data.session.user;
  if (!u) { g('perm-who').textContent = 'Not signed in.'; return null; }
  var md = u.user_metadata || {};
  g('perm-who').textContent = 'Signed in as ' + (md.full_name || md.name || md.provider_id || u.id);
  return md.provider_id || null;
}
async function permLoad() {
  try {
    var pid = await permCheck();
    if (!pid) { permMsg('Sign in with Discord first.'); return; }
    var r = await permClient().from('tool_permissions').select('*').order('username');
    if (r.error) { permMsg(r.error.message); return; }
    g('perm-list').innerHTML = (r.data || []).map(function (row) {
      return '<div style="padding:6px 8px;border-bottom:1px solid #1a3456;font-size:.82rem;cursor:pointer" onclick="permPick(\'' + row.discord_id + '\')">' + (row.username || '(no name)') + ' · ' + row.discord_id + ' · ' + ((row.access || []).join(', ') || 'no tabs') + '</div>';
    }).join('') || 'No users saved yet.';
    permMsg('');
  } catch (e) { permMsg(e.message); }
}
async function permAuto(fromChange) {
  var raw = (g('perm-user').value || '').trim();
  var numeric = /^\d{15,20}$/.test(raw);
  if (!raw || (!numeric && !fromChange)) return;
  if (!numeric && raw.length < 2) return;
  try {
    var sb = permClient();
    var r = numeric
      ? await sb.from('tool_permissions').select('*').eq('discord_id', raw).maybeSingle()
      : await sb.from('tool_permissions').select('*').eq('username', raw).maybeSingle();
    if (r.error) { permMsg('Could not read permissions: ' + r.error.message); return; }
    window.PERM_LOADED_ID = r.data ? r.data.discord_id : (numeric ? raw : null);
    if (r.data) {
      permBuildBoxes(r.data.access);
      if (r.data.username) g('perm-name').value = r.data.username;
      if (!numeric) g('perm-user').value = r.data.discord_id;
      permMsg('Loaded ' + r.data.discord_id + '. Change the tabs and press Save.');
    } else if (numeric) {
      permBuildBoxes([]);
      // no saved tabs for this ID: check the login history before calling them new
      var h = await sb.from('tool_users').select('username,last_login').eq('discord_id', raw).maybeSingle();
      if (h.data) {
        permMsg('Used the tool before (last login ' + (h.data.last_login ? new Date(h.data.last_login).toLocaleString() : 'unknown') + ') but no tabs are saved for them yet. Tick their tabs and press Save.');
      } else {
        permMsg('No saved tabs or login history found for this ID. If they have logged in before, the database read policy may be blocking it: run the anyone-reads-access SQL.');
      }
    } else {
      permMsg('No saved user with that username. Enter their Discord user ID.');
    }
  } catch (e) { permMsg(e.message); }
}
async function permPick(id) {
  try {
    var r = await permClient().from('tool_permissions').select('*').eq('discord_id', id).maybeSingle();
    g('perm-user').value = id;
    g('perm-name').value = (r.data && r.data.username) || '';
    permBuildBoxes(r.data ? r.data.access : []);
    permMsg('Loaded ' + id + '. Change the tabs and press Save.');
  } catch (e) { permMsg(e.message); }
}
async function permSave() {
  try {
    var sb = permClient();
    var pid = await permCheck();
    if (!pid) { permMsg('Sign in with Discord first.'); return; }
    var raw = (g('perm-user').value || '').trim();
    var name = (g('perm-name').value || '').trim();
    if (!raw) { permMsg('Enter a Discord user ID or a username.'); return; }
    var id = raw;
    if (!/^\d{15,20}$/.test(raw)) {
      var f = await sb.from('tool_permissions').select('discord_id').eq('username', raw).maybeSingle();
      if (!f.data) { permMsg('No saved user has that username yet. Enter their Discord user ID instead.'); return; }
      id = f.data.discord_id;
      if (!name) name = raw;
    }
    if (window.PERM_LOADED_ID !== id) {
      permMsg('Loading their current tabs first...');
      await permAuto(true);
      if (window.PERM_LOADED_ID !== id) { permMsg('Could not load their tabs. Check the ID and try again.'); return; }
      permMsg('Loaded their current tabs. Make your changes and press Save again.');
      return;
    }
    var access = [].slice.call(document.querySelectorAll('#perm-boxes input:checked')).map(function (i) { return i.value; });
    var up = await sb.from('tool_permissions').upsert({ discord_id: id, username: name || null, access: access, updated_at: new Date().toISOString() });
    if (up.error) { permMsg(up.error.message); return; }
    permMsg('Saved ' + (name || id) + ': ' + (access.join(', ') || 'no tabs'));
    permLoad();
  } catch (e) { permMsg(e.message); }
}
function permNavVisibility() {
  var b = document.querySelector('button[data-admin-only="1"]');
  if (b) b.style.display = localStorage.getItem('spa_discord_id') === PERM_ADMIN_ID ? '' : 'none';
}
document.addEventListener('DOMContentLoaded', function () { try { permClient(); } catch (e) {} permBuildBoxes([]); permNavVisibility(); });
var PERM_ACCESS = null;
async function supabaseLogin() {
  try {
    var r = await permClient().auth.signInWithOAuth({ provider: 'discord', options: { scopes: 'identify guilds guilds.members.read', redirectTo: location.href.split('#')[0] } });
    if (r.error) g('auth-msg').textContent = r.error.message;
  } catch (e) { window.location.href = discordLoginURL(); }
}
async function recordLogin() {
  var id = localStorage.getItem('spa_discord_id');
  if (!id) return;
  try {
    await permClient().from('tool_users').upsert({ discord_id: id, username: localStorage.getItem('spa_discord_name') || null, last_login: new Date().toISOString() });
  } catch (e) {}
}
async function permListAll() {
  try {
    var sb = permClient();
    var pid = await permCheck();
    if (!pid) { permMsg('Sign in with Discord (admin) first.'); return; }
    var u = await sb.from('tool_users').select('*').order('last_login', { ascending: false });
    if (u.error) { permMsg('Could not read users: ' + u.error.message); return; }
    var a = await sb.from('tool_permissions').select('discord_id,access');
    var acc = {};
    (a.data || []).forEach(function (row) { acc[row.discord_id] = row.access || []; });
    g('perm-list').innerHTML = '<div style="font-size:.8rem;color:var(--text2);margin-bottom:6px">' + (u.data || []).length + ' past users</div>' + (u.data || []).map(function (row) {
      var when = row.last_login ? new Date(row.last_login).toLocaleString() : '';
      return '<div style="padding:6px 8px;border-bottom:1px solid #1a3456;font-size:.82rem;cursor:pointer" onclick="permPick(\'' + row.discord_id + '\')">' + (row.username || '(no name)') + ' · ' + row.discord_id + ' · last login ' + when + ' · tabs: ' + ((acc[row.discord_id] || []).join(', ') || 'none saved') + '</div>';
    }).join('') || 'No past users yet.';
    permMsg('');
  } catch (e) { permMsg(e.message); }
}
async function loadMyAccess() {
  PERM_ACCESS = null;
  var id = localStorage.getItem('spa_discord_id');
  if (!id || id === PERM_ADMIN_ID) return;
  try {
    var r = await permClient().from('tool_permissions').select('access').eq('discord_id', id).maybeSingle();  // public read, see SQL
    if (r.data && Array.isArray(r.data.access)) PERM_ACCESS = r.data.access;
  } catch (e) {}
}
// ── CO-HOST AIRPORT (fills [AIRPORT] in the Co-Host tab) ──
// minutes until the next XX:50 (this PC's clock)
function minsToXX50() {
  var m = new Date().getMinutes();
  return m < 50 ? 50 - m : 110 - m;
}
function applyCohostRoute() {
  var info = g('cohost-route-info');
  var rid = (g('cohost-route').value || '').replace(/\D/g, '');
  if (!rid || typeof ROUTES === 'undefined') { if (info) info.textContent = 'Enter a Route ID to see the route.'; return; }
  var key = 'SPA' + rid;
  for (var ap in ROUTES) {
    var r = ROUTES[ap].routes && ROUTES[ap].routes[key];
    if (r) {
      g('cohost-airport').value = ap;
      g('cohost-dest').value = r.dest.replace(/\s*\[.*\]\s*$/, '');
      if (info) info.innerHTML = '<b style="color:#fff">' + key + '</b>  |  ' + ap + ' [' + ROUTES[ap].icao + ']  →  ' + r.dest + '  |  ' + r.ac;
      applyCohostAirport();
      return;
    }
  }
  if (info) info.textContent = key + ' not found in the route list.';
}
function applyCohostAirport() {
  var pg = document.getElementById('page-cohost');
  if (!pg) return;
  var inp = document.getElementById('cohost-airport');
  var v = inp ? inp.value.trim() : '';
  var dInp = document.getElementById('cohost-dest');
  var dest = dInp ? dInp.value.trim() : '';
  pg.querySelectorAll('.rc-text, .s-text').forEach(function (el) {
    if (el.dataset.tpl === undefined) el.dataset.tpl = el.textContent;
    el.textContent = el.dataset.tpl.replace(/\[AIRPORT\]/g, v || '[AIRPORT]').replace(/\[DESTINATION\]/g, dest || '[DESTINATION]').replace(/\[X\]/g, String(minsToXX50()));
  });
}

// ── LOGIN CHECK (runs after everything above is defined) ──
captureDiscordToken();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enforceLogin);
else enforceLogin();

// ── STARTUP (after all declarations) ──
restoreInputs();
initGreetings();
initCC();
loadState();
applyCohostAirport();
document.addEventListener('DOMContentLoaded', function () { brRestoreRoles(); brRestorePaste(); });
brRender();
update();
renderRecent();
