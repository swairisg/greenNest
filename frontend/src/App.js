import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>GreenNest Frontend</h1>
    </div>
  );
}

export default App;








/*funtion App() part shoud be like this
function App() {

  return (
    <div>
      
      <React.Fragment>
        <Routes>
          <Route path="/" element={<Home/>} />
           <Route path="/mainhome" element={<Home/>}/>
           <Route path="/adduser" element={<AddUser/>} />
           <Route path="/userdetails" element={<Users/>} />
            <Route path="/userdetails/:id" element={<UpdateUsers/>} />
           
        </Routes>
      </React.Fragment> 
    </div>
  );
}


*/