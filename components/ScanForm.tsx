"use client";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'

const inputClass = "h-12 w-full rounded-[10px] border border-zinc-300 bg-white px-3.5 font-mono text-[15px] text-foreground" + "placeholder:text-zinc-500 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10";

const ScanForm = () => {
    const router = useRouter();
    const [url,setUrl] = useState("");
    const[folder,setFolder]=useState("");
    const[error,setError] =useState("");
    const[loading,setLoading]=useState(false);

    // const handleSubmit = ()

  return (
    <div>ScanForm</div>
  )
}

export default ScanForm