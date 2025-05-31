"use client";

import { CheckCircle, StopCircle } from "lucide-react";
import { ToastIcon } from "react-toastify";

const ToastContainerIcon: ToastIcon = ({ type }) => {
  switch (type) {
    case "success":
      return <CheckCircle className="text-primary" />;
    default:
      return <StopCircle className="text-red-500" />;
  }
};

export default ToastContainerIcon;
