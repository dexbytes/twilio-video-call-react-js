import React, { useState, useCallback, useEffect } from "react";
import Video from "twilio-video";
import CreateRoomForm from "./components/roomcreateform";
import Room from "./Room";
import axios from 'axios';
import config from "./config/config";
import { isEmpty, first } from "lodash";

const CreateRoom = () => {
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");
  const [room, setRoom] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [videoRoom, setVideoRoom] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [screenTrack, setScreenTrack] = useState(null);
  const [audioStatus, setAudioStatus] = useState(true);
  const [videoStatus, setVideoStatus] = useState(true);

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
      
      let url = config.base_url+"/v1/video/create-token";
      let params = {
          identity: username,
          roomname: roomName,
        }
      let headers = {
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*'
      }

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
      // let response = null;
      // try {
      //   response =  await axios.post(url, params, headers)
      // } catch (err) {
      //     // Handle Error Here
      //     console.error("err---",  err);
      // }
     
     // const response =  await axios.post(url, params, headers)
     
      // .then(result => { console.log(result); return result; })
      // .catch(error => { console.error(error); throw error; });
      
      // const response = await fetch("/v1/video/create-token", {
      //   method: "POST",
      //   body: JSON.stringify({
      //     identity: username,
      //     roomname: roomName,
      //   }),
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // }).then((res) => res.json());

      const videoTrack = await Video.createLocalVideoTrack();
      setLocalVideoTrack(videoTrack);

      const audioTrack = await Video.createLocalAudioTrack();
      setLocalAudioTrack(audioTrack);

      if(response.data.success && response.data.success.data){
        console.log("response.data", response.data);
        Video.connect(response.data.success.data.token, {
          name: roomName,
          tracks: [videoTrack, audioTrack],
          insights: false
        })
          .then((room) => {
            setVideoRoom(room);
            setConnecting(false);
            setRoom(room);
          })
          .catch((err) => {
            console.error(err);
            setVideoRoom(null);
            setConnecting(false);
          });
      }else{
        console.log("response.data", response.message);
        setError(response.data.message)
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

  const handleAudio = () => {
    room.localParticipant.audioTracks.forEach(publication => {
      if(audioStatus){
        publication.track.disable();
      } else {
        publication.track.enable();
      }
    });
    setAudioStatus(!audioStatus);
  }

  const handleVideo = () => {
    room.localParticipant.videoTracks.forEach(publication => {
      if(videoStatus){
        publication.track.disable();
      } else {
        publication.track.enable();
      }
    });
    setVideoStatus(!videoStatus);
  }

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
      <Room 
        roomName={roomName} 
        room={room} 
        handleLogout={handleLogout}
        handleScreenShare={handleScreenShare} 
        isScreenSharingSupported = { Boolean(
          navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia
        )}
        isScreenSharingEnabled = {Boolean(screenTrack)}
        audioStatus = {audioStatus}
        handleAudio = {handleAudio}
        videoStatus = {videoStatus}
        handleVideo = {handleVideo}
      />
    );
  } else {
    render = (
      <CreateRoomForm
        username={username}
        roomName={roomName}
        handleUsernameChange={handleUsernameChange}
        handleRoomNameChange={handleRoomNameChange}
        handleSubmit={handleSubmit}
        connecting={connecting}
        error={error}
      />
    );
  }
  return render;
};

export default CreateRoom;
