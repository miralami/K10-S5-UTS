import React, { useState, useEffect } from 'react';
import { typingService } from '../services/typingService';

const TypingIndicator = ({ channelId, currentUserId }) => {
  const [typingUsers, setTypingUsers] = useState(new Map());

  useEffect(() => {
    const handleTypingEvent = (event) => {
      // Ignore own events
      if (event.userId === currentUserId) return;

      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        if (event.isTyping) {
          newMap.set(event.userId, {
            name: event.userName,
            timestamp: Date.now(),
          });
        } else {
          newMap.delete(event.userId);
        }
        return newMap;
      });
    };

    // Start the stream
    // Note: In a real app, you might want to lift the stream connection to a context or parent
    // to avoid reconnecting on every render if this component unmounts/remounts often.
    // For now, we assume this component lives as long as the chat is open.
    const stream = typingService.startStream(channelId, currentUserId, handleTypingEvent);

    // Cleanup interval to remove stale typing users (e.g. if missed 'false' event)
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        let changed = false;
        const newMap = new Map(prev);
        for (const [id, data] of newMap.entries()) {
          if (now - data.timestamp > 5000) { // 5 seconds TTL
            newMap.delete(id);
            changed = true;
          }
        }
        return changed ? newMap : prev;
      });
    }, 1000);

    return () => {
      typingService.endStream();
      clearInterval(interval);
    };
  }, [channelId, currentUserId]);

  const users = Array.from(typingUsers.values());

  if (users.length === 0) return null;

  if (users.length === 1) {
    return <div className="text-sm text-gray-500 italic">{users[0].name} is typing...</div>;
  }

  if (users.length === 2) {
    return <div className="text-sm text-gray-500 italic">{users[0].name} and {users[1].name} are typing...</div>;
  }

  return <div className="text-sm text-gray-500 italic">Several people are typing...</div>;
};

export default TypingIndicator;
