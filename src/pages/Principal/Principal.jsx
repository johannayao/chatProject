import React, { useEffect, useState, useRef } from "react";
import ButtonDisconnected from "../../components/ButtonDisconnected/ButtonDisconnected";
import axios from "axios";

import { useSocket } from "../../lib/socket";

function Principal() {
  const [users, setUsers] = useState([]);
  const socket = useSocket();
  const [chats, setChats] = useState([]);
  const [connectUserId, setconnectUserId] = useState([]);
  const [currentChat, setcurrentChat] = useState(null);
  const [message, setmessage] = useState([]);
  const [userName, setuserName] = useState([]);
  const [inputChange, setinputChange] = useState([]);
  useEffect(() => {
    socket?.connect();
    socket?.on("connect", () => {
      socket?.emit("getUsers", (users) => {
        setUsers(users);
      });
    });
    socket?.on("sendMessage", ({data,isnew}) => {
      console.log(data,isnew);
      if(isnew){
        setChats([...chats,data])
      }else{
        setChats(chats.map((s)=>{
          if(s.userId===data.userId && s.contactId===data.contactId){
            console.log("find");
            
            return {...s,messages:[...s.messages,data.message]}
          }else{
            return s
          }
        }
      ))
      }
      console.log("sendMessage  :", );
    });
  }, [socket,chats]);

  useEffect(() => {
    axios
      .get(process.env.IP_SERVER + "/api/chat", {
        headers: { Authorization: JSON.parse(localStorage.getItem("user")) }
      })
      .then((e) => {
        setChats(e.data.chat);
        setuserName(e.data.userName)
        setconnectUserId(e.data.userId);
      });
  },[]);

  const afficherLeNom = (chat) => {
    const isUser = chat.userId === connectUserId;
    if (isUser) {
      return chat.contact;
    } else {
      return chat.user;
    }
  };

  // const afficheDernierMessage = (lo) => {
  //   const ji = lo.user;
  //   if (ji) {
  //     return [""];
  //   } else {
  //     lo.messages;
  //   }
  // };

  const sendMessage = () => {
    socket.emit(
      "sendMessage",
      {
        contactId: currentChat.contactId,
        chatId: currentChat.id,
        message: message
      },
      (data) => {
        console.log(data);
        if(currentChat.id){
          setmessage("")
          setChats(chats.map((s)=>{
            if(s.id===currentChat.id){
              return {...s,messages:[...s.messages,data.message]}
            }else{
              return s
            }
          }
        ))
        }else{
          setChats([...chats,data])
          setcurrentChat({...currentChat,id:data.id})
        }
      }

    );
    
  };


  //  useEffect(()=>{
  //   if(users.length>0){
  //     const contact = users[0]
  //     socket?.emit("initChat",{contactId:contact.id,text:"bonjour"},(data)=>{
  //       console.log("chat data", data);
  //     })
  //   }
  //  },[socket, users])

  return (
    <>
      <ButtonDisconnected />
      <div className="w-screen h-auto p-2 bg-purple-400 ">
        <p className="text-2xl font-bold text-center text-white">
          Chat with Me
        </p>
        <p>{userName}</p>
      </div>
      <div className="w-screen h-[95vh] bg-white flex flex-row items-start justify-start">
        <div className="w-[17%] h-full ">
          <h1 className="w-full font-bold h-[25px] text-2xl text-center pb-2 bg-gray-200 ">
            Users
          </h1>

          {chats.map((z, key) => {
            return (
              <div
                key={key}
                className="w-full h-[70px] flex flex-row items-center justify-start p-1 bg-white  border-b-[1px] border-b-solid border-b-gray-300 relative"
                onClick={() => {
                  setcurrentChat({
                    contactId: afficherLeNom(z).id,
                    id: z.id
                  });
                }}
              >
                <div className="p-8 rounded-full bg-blue-300 bg-[url('https://images.unsplash.com/photo-1438761681033-6461ffad8d80?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHByb2ZpbHxlbnwwfHwwfHx8MA%3D%3D')] bg-cover"></div>
                <div className="flex flex-col items-start justify-start w-full h-full p-1 ml-2">
                  <p className="text-xl font-bold">{afficherLeNom(z)?.name}</p>
                  <p className="overflow-hidden text-gray-500 text-md text-ellipsis"></p>
                </div>
                <div className={`absolute p-2 ${users.find((r)=>r.id===afficherLeNom(z).id)?"bg-lime-400":"bg-red-400"}  rounded-full top-[50px] left-[55px]`}></div>
              </div>
            );
          })}

          {users
            .filter((s) => {
              const isChat = chats.length
                ? chats.find((t) =>
                    t.userId === connectUserId
                      ? t.contactId !== s.id
                      : t.userId !== s.id
                  )
                : true;
              return isChat;
            })
            .map((z, key) => {
              return (
                <div
                  key={key}
                  className="w-full h-[70px] flex flex-row items-center justify-start p-1 bg-white  border-b-[1px] border-b-solid border-b-gray-300 relative"
                  onClick={() => {
                    setcurrentChat({ contactId: z.id });
                  }}
                >
                  <div className="p-8 rounded-full bg-blue-300 bg-[url('https://images.unsplash.com/photo-1438761681033-6461ffad8d80?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHByb2ZpbHxlbnwwfHwwfHx8MA%3D%3D')] bg-cover"></div>
                  <div className="flex flex-col items-start justify-start w-full h-full p-1 ml-2">
                    <p className="text-xl font-bold">{z.name}</p>
                    <p className="overflow-hidden text-gray-500 text-md text-ellipsis"></p>
                  </div>
                  <div className="absolute p-2 bg-lime-400 rounded-full top-[50px] left-[55px]"></div>
                </div>
              );
            })}
        </div>
        <div className="w-[83%] h-[100%] flex flex-col items-start justify-start">
          {currentChat && (
            <>
              <div className="w-full h-[95%] bg-gray-100 flex flex-col items-start justify-start overflow-x-hidden">
                {chats.find((d)=>d.id===currentChat.id)?.messages.map((message, index) => {
                  return (
                    <div
                      key={index}
                      className={`w-[45%] rounded-md ${
                        message.xenderId === connectUserId
                          ? "bg-white self-end text-black"
                          : "bg-blue-400 text-white"
                      } m-2 my-10`}
                    >
                      <p className="text-md m-[1rem] p-4">{message.text}</p>
                      <span className="w-[100%] inline-block text-right font-bold ">
                        {" "}
                        {new Date(message.date).getHours() +
                          ":" +
                          new Date(message.date).getMinutes()}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="w-full h-[5%] flex flex-row items-start justify-start">
                <input
                  value={message}
                  type="text"
                  className="w-[90%] h-full p-2 border-t-solid border-t-gray-300 border-t-[1px] mr-5 outline-none placeholder:italic"
                  placeholder="Enter your message here"
                  onChange={(r) => setmessage(r.target.value)}
                />
                <button
                  className="w-[10%] h-full bg-green-500 text-white p-2 font-bold align-center"
                  onClick={() => sendMessage()}
                >
                  Send
                </button>
              </div>
            </>
          )}
          {!currentChat && <p>veuiller selectionner un utilisateur</p>}
        </div>
      </div>
    </>
  );
}

export default Principal;
