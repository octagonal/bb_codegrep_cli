const url = require('url');
const Table = require('cli-table');
const _ = require('lodash');
const axios = require('axios');
const argv = require('yargs').argv;

const endpoint = 'https://api.bitbucket.org/';
const codeSearch = `2.0/teams/${argv.team}/search/code`;

const CSV = 'csv';
const TABLE = 'table';
const JSON = 'json';

const head = ['Project', 'No. of occurrences'];


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

      const data = _.map(updates, (v,k) => [k, v.length]);

      if(argv.output === CSV) {
        console.log(_.map([head, ...data], (el) => el.join(',')).join('\n'));
      } else if (argv.output === TABLE){
        const occurenceTable = new Table({head , colWidths: [50, 25]});
        occurenceTable.push(...data)
        console.log(occurenceTable.toString());
      } else {
        console.log(JSON.stringify(_.map(data, ([proj, num]) => ({
          [head[0].toLowerCase()]: proj,
          [head[1].toLowerCase().replace(/[^a-z]+/g, '_')]: num,
        }))));
      }

      return data;
    }
  } catch (err) {
    console.log(err.response);
    return null;
  }
}

getData(argv.query);
