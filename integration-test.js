const chai = require('chai');
const chaiHttp = require('chai-http');
const {app} = require('./app');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Integration Tests', function () {
  this.timeout(10000); 

  describe('GET /persons', function () {
    it('should return a list of Star Wars characters when searching by name', function (done) {
      this.timeout(10000); 

      chai
        .request(app)
        .get('/persons?q=Luke')
        .end(function (err, res) {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length.above(0);
          expect(res.body[0]).to.have.property('id');
          expect(res.body[0]).to.have.property('name');
          expect(res.body[0]).to.have.property('movies');
          done();
        });
    });

    it('should return a 500 Internal Server Error when an invalid query is provided', function (done) {
      this.timeout(10000); 

      chai
        .request(app)
        .get('/persons?q=INVALID_QUERY')
        .end(function (err, res) {
          expect(res).to.have.status(500);
          expect(res.body).to.have.property('error', 'Internal Server Error');
          done();
        });
    });
  });

  describe('GET /persons/:id', function () {
    it('should return a single Star Wars character by ID', function (done) {
      this.timeout(10000); 

      chai
        .request(app)
        .get('/persons/1')
        .end(function (err, res) {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('id', '1');
          expect(res.body).to.have.property('name');
          expect(res.body).to.have.property('movies');
          done();
        });
    });

    it('should return a 404 Person not found error for an invalid ID', function (done) {
      this.timeout(10000); 

      chai
        .request(app)
        .get('/persons/99')
        .end(function (err, res) {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('error', 'Person not found');
          done();
        });
    });
  });
});
