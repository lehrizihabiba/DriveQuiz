import React from 'react';
import '../index.css';

function OctagonWrapper() {
  return (
    <div className="absolute top-[57%] right-[22%] translate-y-1/2 z-[1]">
      
      <div className="octagon1 absolute w-[420px] h-[420px] bg-gradient-to-br from-[#f1a132] to-[#ffcc70] -ml-36 mt-4 opacity-10 z-[1] transition-all duration-[400ms] ease-in-out hover:scale-[1.03] hover:opacity-15" />
      
      
      <div className="octagon2 absolute w-[370px] h-[370px] bg-gradient-to-br from-[#f1a132] to-[#ffcc70] -ml-20 mt-20 opacity-[0.08] z-[2] transition-all duration-[400ms] ease-in-out hover:scale-[1.03] hover:opacity-15" />
    </div>
  );
}

export default OctagonWrapper;