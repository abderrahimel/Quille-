
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { PDFLoader } from  'langchain/document_loaders/fs/pdf';
import {  OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { PineconeStore } from 'langchain/vectorstores/pinecone'
import { getPineconeClient } from "@/lib/pinecone";

const f = createUploadthing();
 
const auth = (req: Request) => ({ id: "fakeId" }); // Fake auth function
 
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    // Set permissions and file types for this FileRoute
    // this middleware will run when somebody has requested to upload a file will check if it is authenticated
    .middleware(async ({ req }) => {
        const { getUser } = getKindeServerSession();
        const user = getUser();
        if(!user || !user.id) throw new Error('Unauthorized')

      return {userId: user.id};
    })
    // here when the file uploaded successfully into the cloud uploadaThing we have to add it to db userId is in metadata bring it in here by return it from the middleware 
    .onUploadComplete(async ({ metadata, file }) => {
      const createdFile = await db.file.create({
        data: {
          key: file.key,
          name: file.name,
          userId: metadata.userId,
          url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
          uploadStatus: "PROCESSING"
        },
      })

      try {
        const response = await fetch(`https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`);
        // here will get the page of pdf as blob
        const blob = await response.blob();
        const loader = new PDFLoader(blob);

        const pageLevelDocs = await loader.load();
        const pagesAmt = pageLevelDocs.length
        // vectorize and index entire document
        const pinecone = await getPineconeClient()
        const pineconeIndex = pinecone.Index('quill')

        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
        })

        await PineconeStore.fromDocuments( pageLevelDocs, embeddings, 
          { pineconeIndex, 
            // namespace: createdFile.id,
         } )


        await db.file.update({
          data:{
            uploadStatus: "SUCCESS"
          },
          where: {
            id: createdFile.id
          }
        });
      } catch (error) {
        await db.file.update({
          data:{
            uploadStatus: "FAILED"
          },
          where: {
            id: createdFile.id
          }
        });
      }
      
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;

