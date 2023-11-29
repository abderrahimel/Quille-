"use client"
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useUploadThing } from '@/lib/uploadthing';
import { Cloud, File, Loader2 } from 'lucide-react';
import { useState } from 'react'
import Dropzone from 'react-dropzone';
import { trpc } from '../app/_trpc/client';
import { useRouter } from 'next/navigation';

const UploadDropzone = () =>{
  // router navigation around the route of the app
          const router = useRouter()
          const  [isUploading, setIsUploading] = useState<boolean>(false)
          const  [uploadProgress, setUploadProgress] = useState<number>(0)
          const { toast } = useToast()
          const { startUpload } = useUploadThing("pdfUploader")
          // making api request to get the file from db
          const {mutate: startPolling} = trpc.getFile.useMutation(
            {
            onSuccess: (file) => {
              router.push(`/dashboard/${file.id}`)
            },
          // if the response not success retry after 500 second
            retry: true,
            retryDelay: 500
          }
          );
          const startSimulatedProgress = () => {
            setUploadProgress(0);

            const interval = setInterval(()=>{
              setUploadProgress((prevProgress)=> {
                // if the progress bar up to the end we stop the progress from increasing 
                if(prevProgress >= 95){
                  clearInterval(interval)
                  return prevProgress
                } 
                // else progress by 5
                return prevProgress + 5
              })
            }, 500)
            return interval
          }
  return (<Dropzone multiple={false} onDrop={ async(acceptedFile)=>{
    setIsUploading(true)

    const progressInterval  = startSimulatedProgress()

    //  handle the file uploading uploading it
    const res = await startUpload(acceptedFile)

    if(!res){
      return toast({
        title: "Something went wrong",
        description: "Please try again later",
        variant: "destructive"
      })
    }
    const [fileResponse] = res
    console.log(res)
    const key = fileResponse?.key
    if(!key){
      return toast({
        title: "Something went wrong",
        description: "Please try again later",
        variant: "destructive"
      })
    }
     


    //  when we done uploading we clear the interval
    clearInterval(progressInterval)
    setUploadProgress(100)
    // get until get the file from db then redirect the user to the file /dashboard/sdfklgkflmdgklf444d
    console.log('start polling')
    startPolling({ key });
  }}>
    {/* when somebody drop file it will affected to acceptedFiles as input for array function */}
      {({getRootProps, getInputProps, acceptedFiles})=>(
        <div {...getRootProps()} className='border h-64 m-4 border-dashed border-gray-300 rounded-lg'>
          <div className="flex items-center justify-center h-full w-full">
            <label htmlFor="dropzone-file" className='flex flex-col items-center justify-center w-full h-full rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100'>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Cloud className='h-6 w-6 text-zinc-500 mb-6' />
                <p className="mb-2 text-sm ext-zinc-700">
                  <span className="font-semibold">Click to upload</span>{" "} or drag and drop
                </p>
                <p className='text-xs text-zinc-500'> PDF (up to 4MB)</p>
              </div>

              {(acceptedFiles && acceptedFiles[0]) ? (
                <div className="mw-w-xs bg-white flex items-center rounded-md overflow-hidden outline outline-[1px] outline-zinc-200 divide-x divide-zinc-200">
                  <div className="px-3 py-2 h-full grid place-items-center">
                    <File className='h-4 w-4 text-blue-500' />
                  </div>
                  <div className="px-3 py-2 h-full text-sm truncate">
                    {acceptedFiles[0].name}
                  </div>
                </div>
            ):null}
            {isUploading ? (
              <div className="w-full mt-4 max-w-xs mx-auto">
                  <Progress
                      indicatorColor={ uploadProgress === 100 ? 'bg-green-500': ''}
                      value={uploadProgress} className='h-1 w-full bg-zinc-200' />
                 {uploadProgress === 100 ? (
                  <div className="flex gap-1 items-center justify-center text-sm text-zinc-700 text-center pt-2">
                    <Loader2 className='-3 w-3 animate-spin' />
                    Redirecting...
                  </div>
                 ):null}
              </div>
            ):null}
            <input {...getInputProps()} type="file" id="dropzone-file" className='hidden' />
            </label>
          </div>
        </div>
      )}
  </Dropzone> )
}
// model upload button
function UploadButton() {
    const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <Dialog open={isOpen} onOpenChange={(v)=>{
      if(!v){
        setIsOpen(v)
      }
    }}>
      <DialogTrigger onClick={()=> setIsOpen(true)} asChild>
        <Button>Upload PDF</Button>
      </DialogTrigger>
      <DialogContent>
         <UploadDropzone />
      </DialogContent>
    </Dialog>
  )
}

export default UploadButton