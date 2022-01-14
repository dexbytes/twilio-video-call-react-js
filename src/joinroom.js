import React, { useState, useCallback, useEffect } from "react";
import Video from "twilio-video";
import JoinRoomForm from "./components/joinroomform";
import Room from "./Room";
import axios from 'axios';
import config from "./config/config";
import { isEmpty, first } from "lodash";

const JoinRoom = () => {
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [videoRoom, setVideoRoom] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [screenTrack, setScreenTrack] = useState(null);

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
      //const response =  await axios.post(url, params, headers);
      const response = await new Promise((resolve, reject) => {
        axios.post(url, params, headers)
         .then(function (data) {
           resolve(data);
         })
         .catch(function (error) {
          console.log("error", error)
          if (error.response) {
            resolve(error.response.data)
            //return error.response.data
          } 
         });
       });

       const videoTrack = await Video.createLocalVideoTrack();
       setLocalVideoTrack(videoTrack);
 
       const audioTrack = await Video.createLocalAudioTrack();
       setLocalAudioTrack(audioTrack);

       if(response.data && response.data.success && response.data.success.data){
        Video.connect(response.data.success.data.token, {
          name: roomName,
          tracks: [videoTrack, audioTrack],
          insights: false
        })
          .then((room) => {
            setConnecting(false);
            setRoom(room);
            setVideoRoom(room);
          })
          .catch((err) => {
            console.error(err);
            setConnecting(false);
            setVideoRoom(null);
          });
      }else{
        console.log("response.data", response.message);
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

  const handleScreenShare = async () => {
    try {
      if (!screenTrack) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        const newScreenTrack = first(stream.getVideoTracks());

        setScreenTrack(new Video.LocalVideoTrack(newScreenTrack));

        videoRoom.localParticipant.publishTrack(newScreenTrack);
        videoRoom.localParticipant.unpublishTrack(localVideoTrack);
      } else {
        videoRoom.localParticipant.unpublishTrack(screenTrack);
        videoRoom.localParticipant.publishTrack(localVideoTrack);
        if(screenTrack){
          setScreenTrack(null);
        }
      }
    } catch (error) {
      if(screenTrack){
        setScreenTrack(null);
      }
    }
  };

  let render;
  if (room) {
    render = (
      <Room 
        roomName={roomName} 
        room={room} 
        handleLogout={handleLogout}
        handleScreenShare={handleScreenShare}
        isScreenSharingSupported = { Boolean(
          navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia
        )}
        isScreenSharingEnabled = {Boolean(screenTrack)}
      />
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
