// server components
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import Dashboard from "../../components/Dashboard";
// this page will rendered in the server so only html will send to front end
//  and to make it render in the front end side just use in the top "use client"
const Page = async () => {
    //  here we get all data of user logged in to this app
  const { getUser } = getKindeServerSession()
  const user = getUser()
  
  if (!user || !user.id) redirect('/auth-callback?origin=dashboard');
  const dbUser = await db.user.findFirst({
    where: {
      id: user.id
    }
  })
  //  if the user not in db then will call auth-callback that will create it in db
  if (!dbUser)  redirect('/auth-callback?origin=dashboard');
return <Dashboard/>
}

export default Page;