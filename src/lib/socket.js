import { useRef } from "react";
import { io } from "socket.io-client";
export const useSocket = () => {
  const socket = useRef(
    new io("https://chatproject-q1bs.onrender.com", {
      auth: {
        token: `${JSON.parse(localStorage.getItem("user"))}`
      },
      autoConnect: false
    })
  );
  /*  */
  return socket.current;
};
