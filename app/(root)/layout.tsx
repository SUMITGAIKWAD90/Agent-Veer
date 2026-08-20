import React, { ReactNode } from 'react'
import Image from 'next/image'
import { isAuthenticated } from '@/lib/actions/auth.action'
import {redirect} from 'next/navigation'

const Rootlayout = async ({children} : {children : ReactNode}) => {
  const isUserAuthenticated = await isAuthenticated();

  if(!isUserAuthenticated) redirect('/sign-in');

  return (
    <div className="root-layout">
      <nav>
        <link href="/" className="flex items-center gap-2"></link>
        <Image src='/logo.svg' alt='logo' width={38} height={32}/>
        <h2 className='text-primary-100'>Agent-Veer</h2>
      </nav>

      {children}
      {/* this is imp cause to render the page.tsx on home page {children} */}

    </div>
  )
}

export default Rootlayout