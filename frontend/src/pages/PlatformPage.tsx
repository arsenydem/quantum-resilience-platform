import { useState } from "react";
import { NetworkNode } from "../types";
import PlatformForm from "../components/PlatformForm";
import { useNavigate } from "react-router-dom";

export default function PlatformPage() {
  const navigate = useNavigate();
  const [, setNodes] = useState<NetworkNode[]>([]);

  return (
    <PlatformForm
      onNext={(n) => {
        setNodes(n);
        sessionStorage.setItem("platformNodes", JSON.stringify(n));
        navigate("/threat");
      }}
    />
  );
}