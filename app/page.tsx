"use client"
import Image from "next/image";
import {supabase} from '@/lib/supabaseClient'
import {useEffect} from "react";

export default function Home() {
    useEffect(() => {
        async function test() {
            const {data, error} = await supabase.from('users').select('*').limit(1)
            if (error) console.error('Supabase connection failed:', error)
            else console.log('Supabase connection successful:', data)
        }

        test()
    }, []);


    return (
        <h1 className={'text-center my-16 text-4xl'}>Hi Team Kraken</h1>
    );
}