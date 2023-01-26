import axios from "axios";
import React, { useEffect, useState } from "react";
import "./style.scss";

type Notification = {
  color: string;
  message: string;
};

export const NotificationBar: React.FC = () => {
  const [notification, setNotification] = useState<Notification>();
  const [hide, setHide] = useState(false);

  const getNotification = async (abortController: AbortController) => {
    const notificationURL = `/api/notifications/topbar`;
    const opts = { signal: abortController?.signal };

    const { data } = await axios.get(notificationURL, opts);
    if (!data) return;

    const lastMessage = localStorage.getItem("seenNotification");
    const shouldHide = lastMessage === data.message;

    setHide(shouldHide);
    setNotification(data);

    if (!shouldHide) return;
    localStorage.setItem("seenNotification", data.message);
  };

  const handleClose = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.preventDefault();
    setHide(true);
    if (notification?.message) {
      localStorage.setItem("seenNotification", notification?.message);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    getNotification(abortController);
    return () => {
      abortController.abort();
    };
  }, []);

  const isHidden = hide || !notification;
  const classNames = [
    notification?.color ? `notification-color-${notification?.color}` : "",
    "notification-bar",
    isHidden ? "hide" : "reveal",
  ]
    .join(" ")
    .trim();

  return (
    <div className={classNames} onClick={handleClose}>
      <span className="notification-text">{notification?.message}</span>
      <span className="close-notification">×</span>
    </div>
  );
};
