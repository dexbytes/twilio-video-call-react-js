import React, { useState, useCallback, useEffect } from "react";
import Video from "twilio-video";
import JoinRoomForm from "./components/joinroomform";
import Room from "./Room";
import axios from 'axios';
import config from "./config/config";

const JoinRoom = () => {
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const handleUsernameChange = useCallback((event) => {
    setUsername(event.target.value);
  }, []);

  const handleRoomNameChange = useCallback((event) => {
    setRoomName(event.target.value);
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setConnecting(true);

      let url = config.base_url+"/v1/video/join-room";
      let params = {
          identity: username,
          roomname: roomName,
        }
      let headers = {
            "Content-Type": "application/json",
      }
      const response =  await axios.post(url, params, headers);

      // const response = await fetch("/v1/video/join-room", {
      //   method: "POST",
      //   body: JSON.stringify({
      //     identity: username,
      //     roomname: roomName,
      //   }),
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // }).then((res) => res.json());
      if(response.data.success && response.data.success.data){
        Video.connect(response.data.success.data.token, {
          name: roomName,
        })
          .then((room) => {
            setConnecting(false);
            setRoom(room);
          })
          .catch((err) => {
            console.error(err);
            setConnecting(false);
          });
      }else{
        setError(response.message)
      }
     
    },
    [roomName, username]
  );

  const handleLogout = useCallback(() => {
    setRoom((prevRoom) => {
      if (prevRoom) {
        prevRoom.localParticipant.tracks.forEach((trackPub) => {
          trackPub.track.stop();
        });
        prevRoom.disconnect();
      }
      return null;
    });
  }, []);

  useEffect(() => {
    if (room) {
      const tidyUp = (event) => {
        if (event.persisted) {
          return;
        }
        if (room) {
          handleLogout();
        }
      };
      window.addEventListener("pagehide", tidyUp);
      window.addEventListener("beforeunload", tidyUp);
      return () => {
        window.removeEventListener("pagehide", tidyUp);
        window.removeEventListener("beforeunload", tidyUp);
      };
    }
  }, [room, handleLogout]);

  let render;
  if (room) {
    render = (
      <Room roomName={roomName} room={room} handleLogout={handleLogout} />
    );
  } else {

    render = (

      <>
        <JoinRoomForm
          username={username}
          roomName={roomName}
          handleUsernameChange={handleUsernameChange}
          handleRoomNameChange={handleRoomNameChange}
          handleSubmit={handleSubmit}
          connecting={connecting}
          error={error}
        />
      </>
    );
  }
  return render;
};

export default JoinRoom;
