import loadJson from '../components/load-json/'
import { Drugs } from './modules/drugs'

const app = {

	init: () => {

		loadJson('<%= path %>/assets/world.json?t=' + new Date().getTime())
			.then((map) => {
				app.map(map)
			})

	},

	map: (map) => {

		loadJson('https://interactive.guim.co.uk/docsdata/1kcNQJwlogMeyoW08GNkp08oct-O5xeJv_EBXb2GTioo.json?t=' + new Date().getTime())
			.then((resp) => {
				new Drugs(resp.sheets.Sheet1, map)
			})

	}


}

app.init()