const express = require("express");
const path = require("path");

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server initialized");
    });
  } catch (e) {
    console.log(`DBerror:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
  };
};
//Returns a list of all states in the state table

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    select * from state`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//Returns a state based on the state ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    select * from state where 
    state_id= ${stateId}`;
  const stateDetails = await db.get(getStateQuery);
  response.send(stateDetails);
});

//Create a district in the district table
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
  insert into district (district_name,
   state_id,
  cases,
  cured,
  active,
  deaths ) values (
      '${districtName}',
      '${stateId}',
      '${cases}',
      '${cured}',
      '${active}',
      '${deaths}')
   `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//Returns a district based on the district ID

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    select * from district where 
    district_id= ${districtId}`;
  const districtDetails = await db.get(getDistrictQuery);
  response.send(districtDetails);
});

//Deletes a district from the district table
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    delete from district
    where district_id=${districtId}`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Updates the details of a specific district
app.put("/districts/:districtId/", async (request, response) => {
  const districtDetails = request.body;
  const { districtId } = request.params;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
  update district set
  district_name='${districtName}',
  state_id='${stateId}',
  cases='${cases}',
  cured='${cured}',
  active='${active}',
  deaths='${deaths}'
  where district_id=${districtId}`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const totalCasesQuery = `
    select cases totalCases,
    cured totalCured,
    active totalActive,
    deaths totalDeaths from district
    inner join state on
    district.state_id=state.state_id
    where district.state_id=${stateId}`;
  const totalCases = await db.all(totalCasesQuery);
  response.send(totalCases);
});

//Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    select state_name from state
    inner join
    district on state.state_id=district.state_id
    where district.district_id=${districtId}`;
  const stateName = await db.all(getStateNameQuery);
  response.send(stateName);
  console.log(stateName);
});
module.exports = app;
