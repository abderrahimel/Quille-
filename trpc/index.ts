// backend side
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
// midleware
import { privateProcedure, publicProcedure, router } from './trpc';
import { TRPCError } from '@trpc/server';
import { db } from '@/db';
 import {z } from 'zod'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query';
// here declare api endpoints
export const appRouter = router({
  // route check if user in db and if it is not create it in db getting data from db
  authCallback: publicProcedure.query( async()=>{
    const { getUser } = getKindeServerSession() 
    const user = getUser()
    if(!user.id || !user.email) throw new TRPCError({code: 'UNAUTHORIZED'})
    // check if user is in db or not
      //  first get the user logged in from db where id is the id for the user currently logged in
       const dbUser = await db.user.findFirst({
        where: {
          id: user.id
        }
       })
       if(!dbUser){
        // user not in db so will create it in db
        await db.user.create({
          data: {
            id: user.id,
            email: user.email
          }
        })
       }
    return {success: true}
  }),
  // route getUserFiles privateProcedure is auth middleware check if user is authenticated
  getUserFiles: privateProcedure.query( async({ctx})=>{
    const { userId } = ctx

    return await db.file.findMany({
      where:{
        userId
      }
    })
  }),

  getFileUploadStatus:privateProcedure.input(z.object({fileId: z.string()})).query(async ({input, ctx})=>{
      const file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId: ctx.userId,
        }
      });
      if(!file){
        return {status: "PENDING" as const};
      }
      return {status: file.uploadStatus};
  }),

  getFileMessages: privateProcedure.input(
  z.object({
    // nullish means it is optionnal
  limit: z.number().min(1).max(100).nullish(),
  cursor: z.string().nullish(),
  fileId: z.string(),
  })
).query(async({ctx, input})=>{
    const {userId } = ctx;
    const { fileId, cursor } = input;
// when the page is loaded the last 10 messages will be loaded and when you scroll down another 10 will loaded
    const limit = input.limit ?? INFINITE_QUERY_LIMIT
  
    const file = await db.file.findFirst({
      where:{
        id: fileId,
        userId
      }
    })
    if(!file)  throw new TRPCError({code: 'NOT_FOUND'})
    const messages = await db.message.findMany({
      //  + 1 to include also one message before limit to be there as when the user scroll in the textarea with see it
      take: limit + 1,
      where:{
        fileId
      },
      orderBy:{
        createdAt:"desc"
      },
      cursor: cursor ? {id: cursor }: undefined,
      // here the colomun in the table that should be return this query from table
      select: {
        id: true,
        isUserMessage: true,
        createdAt: true,
        text: true
      }
  })
  let nextCursor: typeof cursor | undefined = undefined

  if(messages.length > limit){
    // .pop Removes the last element from an array and returns it. If the array is empty, undefined is returned and the array is not modified.
    const nextItem = messages.pop()
    nextCursor = nextItem?.id;
  }
  return {
    messages,
    // nextCursor to know from where we have to start fitshing the data in the table messages
    nextCursor,
  }
}),
  // get File route 
   getFile: privateProcedure.input(z.object({key: z.string()})).mutation(async({ctx, input})=>{
      const { userId } = ctx
      // check if the file uploaded is there in db
      const file = await db.file.findFirst({
        where: {
          key: input.key,
          userId
        },
      });
      if(!file) throw new TRPCError({code: "NOT_FOUND"})
      
      return file
   }),
  // post request 
  deleteFile: privateProcedure.input(z.object({id: z.string()})).mutation(async({ctx, input})=>{
    const {userId } = ctx
    const file = await db.file.findFirst({
      where: {
        // input.id we get from post request input(z.object({id: z.string()}))
        id: input.id,
        userId,
      },
    })
    //  if the file not in db
    if(!file) throw new TRPCError({code: "NOT_FOUND"})
    //  else deleted the file where id ===input.id
    await db.file.delete({
      where: {
        id: input.id,
      }
    });
    return file;
  }),
});
 
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;