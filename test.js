const chai = require('chai');
const { transformPersonData } = require('./app'); // Import the function to test

const expect = chai.expect;

describe('Unit Tests', () => {
  // Test transformPersonData function
  describe('transformPersonData', () => {
    it('should transform SWAPI data into the desired format', async () => {
      // Mock SWAPI response data
      const swapiData = {
        url: 'https://swapi.dev/api/people/1/',
        name: 'Luke Skywalker',
        birth_year: '19 BBY',
        gender: 'Male',
        height: '172',
        mass: '77',
        films: ['https://swapi.dev/api/films/1/'],
      };

      const transformedData = await transformPersonData(swapiData);

      expect(transformedData).to.deep.equal({
        id: '1',
        name: 'Luke Skywalker',
        birth_year: '19 BBY',
        gender: 'Male',
        height: '172',
        weight: '77',
        movies: [
          {
            title: 'A New Hope',
            episode: 4,
            director: 'George Lucas',
            release_date: '1977-05-25',
          },
        ],
      });
    });
  });
});

