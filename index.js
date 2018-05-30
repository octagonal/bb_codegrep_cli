const url = require('url');
const Table = require('cli-table');
const _ = require('lodash');
const axios = require('axios');
const argv = require('yargs').argv;

const endpoint = 'https://api.bitbucket.org/';
const codeSearch = `2.0/teams/${argv.team}/search/code`;
const occurenceTable = new Table({
  head: ['Project', 'No. of occurrences']
  , colWidths: [50, 25]
  , chars: { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
             , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
             , 'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼'
             , 'right': '║' , 'right-mid': '╢' , 'middle': '│' }
});

async function getData(query, page = 0, existingData = []) {
  try {
    const { data } = await axios.get(
      url.resolve(endpoint, codeSearch),
      {
        auth: {
          username: argv.user,
          password: argv.pass,
        },
        params: {
          search_query: (query),
          ...((() => { return page > 0 ? { page } : {};})()),
        },
      });


    const updatedData = Array.prototype.concat(data.values, existingData);

    if(data.next) {
      return getData(query, page + 1, updatedData);
    } else {
      const updates = _.groupBy(updatedData.map((el) => el
                       .file
                       .links
                       .self
                       .href
                       .match(/^.*repositories\/[^\/]*\/([^\/]*)/)[1])
      );

      occurenceTable.push(
        ...(_.map(updates, (v,k) => [k, v.length]))
      );

      console.log(occurenceTable.toString());

      return updatedData;
    }
  } catch (err) {
    console.log(err.response);
    return null;
  }
}

getData(argv.query);
