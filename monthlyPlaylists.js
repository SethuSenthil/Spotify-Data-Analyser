const data = require('./master.json')
let onePrint = false
//https://play.spotify.com/search/artist:Kardinal%20Offishall%20track:Dangerous

let temp = ''

for (const [year, yearData] of Object.entries(data.years)) {
    for (const [month, monthData] of Object.entries(yearData.months)) {
        let i = 0
        for (const [tally, tallyItem] of Object.entries(monthData.tally)) {
            if(i < 20){
                temp = tallyItem
                i++
            }else{
                i = 0
                break;
            }
        }
    }
  }

  temp = {name: data.trackIndexes[temp.nameTag]}

  console.log(temp)