import React from "react";

const Error = () => {
  return (
    <div className="flex flex-row h-screen w-full justify-center items-center">
      <span
        className="btn bg-error p-4 text-primary-content"
        onClick={() => window.location.reload()}
      >
        An Unknown Error Occured{" "}
      </span>
    </div>
  );
};

export default Error;
