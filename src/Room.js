import React, { useEffect, useState } from "react";
import Participant from "./Participant";

const Room = (props) => {
  const {
    roomName, room, handleLogout, handleScreenShare, isScreenSharingSupported, isScreenSharingEnabled=false, audioStatus, handleAudio,
    videoStatus, handleVideo
  } = props;
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const participantConnected = (participant) => {
      setParticipants((prevParticipants) => [...prevParticipants, participant]);
    };

    const participantDisconnected = (participant) => {
      setParticipants((prevParticipants) =>
        prevParticipants.filter((p) => p !== participant)
      );
    };

    room.on("participantConnected", participantConnected);
    room.on("participantDisconnected", participantDisconnected);
    room.participants.forEach(participantConnected);
    return () => {
      room.off("participantConnected", participantConnected);
      room.off("participantDisconnected", participantDisconnected);
    };
  }, [room]);

  const remoteParticipants = participants.map((participant) => (
    <Participant key={participant.sid} participant={participant} />
  ));

  return (
    <div className="room">
      <h2>Room: {roomName}</h2>
      <div className="local-participant">
        {room ? (
          <Participant
            key={room.localParticipant.sid}
            participant={room.localParticipant}
          />
        ) : (
          ""
        )}
      </div>
      <h3>Remote Participants</h3>
      <div style={{textAlign: "center"}}>
        <button 
          style={{marginRight:"10px"}}
          onClick={handleLogout}
        >
          Leave
        </button>
        <button 
          style={{marginRight:"10px"}}
          onClick={handleScreenShare}
          disabled={!isScreenSharingSupported}
        >
          {isScreenSharingEnabled ? "Stop sharing" : "Start sharing"}
        </button>
        <button 
          style={{marginRight:"10px"}}
          onClick={handleAudio}
        >
          {(audioStatus)? "Audio Mute": "Audio Unmute"}
        </button>
        <button 
          style={{marginRight:"10px"}}
          onClick={handleVideo}
        >
          {(videoStatus)? "Video Mute": "Video Unmute"}
        </button>
      </div>  
      <div className="remote-participants">{remoteParticipants}</div>
    </div>
  );
};

export default Room;
