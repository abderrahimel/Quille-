"use client"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { ChevronDown, ChevronUp, Divide, Loader2, RotateCw, Search } from 'lucide-react';
import { useState } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useResizeDetector } from 'react-resize-detector';
import { useForm } from 'react-hook-form'    
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import SimpleBar from 'simplebar-react'
import PdfFullscreen from './PdfFullscreen';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
interface PdfRenderProps {
  url: string
}

function PdfRenderer({url}: PdfRenderProps) {
    const { toast } =  useToast()
    const [numPages, setNumPages] = useState<number>()
    const [currPage, setCurrPage] = useState<number>(1)
    const [scale, setScale] = useState<number>(1);
    const [rotation, setRotation] = useState<number>(0);
     // isLoading && renderedScale for compatible every device 
    const [renderedScale, setRenderedScale] = useState<number | null>(null);
    const isLoading = renderedScale !== scale

    // validator  the input that the user put to go in a page of the PDF
    const CustomPageValidator = z.object({
        page:z.string().refine((num)=>Number(num) > 0 && Number(num) <= numPages!)
    });
    // now the input from the user should be type TCustomPageValidator means o be between 1 and numPages in PDF
    type TCustomPageValidator = z.infer<typeof CustomPageValidator>
    //  form validator
    const { register, handleSubmit, formState: { errors }, setValue } = useForm<TCustomPageValidator>({
      defaultValues:{
        page: "1"
      },
      resolver: zodResolver(CustomPageValidator)
    });
    const {width, ref } = useResizeDetector()
const handlePageSubmit = ({page,}:TCustomPageValidator)=>{
    setCurrPage(Number(page));
    // set the value in the input form
    setValue("page", String(page))
}
   return (
    <div className="w-full bg-white  rounded-md shadow flex flex-col items-center" >
              <div className="h-14 bg-white w-full border-b border-zinc-200 flex items-center justify-between px-2">
                <div className="flex items-center gap-1 5">
                  <Button
                      disabled={currPage <= 1}
                      onClick={()=>{
                        setCurrPage((prev)=> (prev - 1 > 1 ? prev - 1 : 1))
                        // here we set the value for the input form for pagination
                        setValue("page", String(currPage - 1))
                      }}
                      aria-label='previous page'>
                      <ChevronDown className='h-4 w-4' />
                  </Button>
                  <div className="flex items-center gap-1.5">
                      {/*  form validator for the input cn('w-12 h-8', errors.page && 'outline-red-500')  */}
                      <Input {...register('page')} className={errors.page ? "w-12 h-8 focus-visible:ring-red-500": "w-12 h-8"}
                       onKeyDown={(e)=>{
                        if(e.key === "Enter")
                        // validat the input here before calling the handlePageSubmit function
                        {handleSubmit(handlePageSubmit)()}
                       }}
                      />
                       <p className='text-zinc-700 text-sm space-x-1'>
                          <span>/</span>
                          <span>{numPages ?? ''}</span>
                       </p>
                  </div>

                  <Button
                  disabled={
                    numPages === undefined ||
                    currPage === numPages
                  }
                      onClick={()=>{
                        setCurrPage((prev)=>(prev + 1 > numPages! ? numPages!: prev + 1)
                        )
                        // here we set the value for the input form for pagination
                        setValue("page", String(currPage + 1))
                      }}
                      aria-label='next page'>
                      <ChevronUp className='h-4 w-4' />
                  </Button>
                </div>
                      {/* here we add menu for zoom in zoom out content of the PDF file */}
                <div className="space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button className='gap-1.5' aria-label='zoom' variant="ghost">
                       <Search className='h-4 w-4'  />
                        {scale * 100}% <ChevronDown className='h-3 w-3 opacity-50' />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={()=> setScale(1)}>
                       100%
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={()=> setScale(1.5)}>
                       150%
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={()=> setScale(2.5)}>
                       250%
                    </DropdownMenuItem>
                    
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                    onClick={()=>setRotation((prev)=> prev + 90)}
                    variant='ghost' aria-label='rotate 90 degrees'>
                  <RotateCw className='h-4 w-4'/>
                </Button>
                <PdfFullscreen fileUrl={url} />
                </div>
              </div>

       <div className="flex-1 w-full max-h-screen">
               {/* simpleBar used to not let the document seem with size big than the  */}
            <SimpleBar autoHide={false} className='max-h-[calc(100%)-10rem]'>
              <div ref={ref}>
                <Document loading={
                  <div className='flex justify-center'>
                    <Loader2 className='my-24 h-6 w-6 animate-spin' /> 
                  </div>
                }
                onLoadError={()=>{
                  toast({
                    'title':"Error loading PDF",
                    "description": 'Please try again later',
                    'variant': "destructive"
                  })
                }}
                onLoadSuccess={({numPages})=> setNumPages(numPages) }
                    file={url}
                    className='max-h-full'>
                      {isLoading && renderedScale ?<Page width={width ? width: 1}      pageNumber={currPage} 
                      // scale represent the size of the content in page
                        scale={scale}
                        rotate={rotation}
                        key={'@' + renderedScale}
                      /> : null}
                      {/* here to make sure that the page will render in different screen device whatever it be the performance slowlly or highlly we render when the event success then change the renderedScale to scale then the isloading will set to true otherwise false  */}
                      <Page 
                          className={isLoading ? "hidden": ""}
                          width={width ? width: 1}        pageNumber={currPage} 
                       // scale represent the size of the content in page
                        scale={scale}
                        rotate={rotation}
                        key = {"@" + scale}
                        loading={
                          <div className='flex justify-center'>
                            <Loader2 className='my-24 h-6 w-6 animate-spin' />
                          </div>
                        }
                        onRenderSuccess={() => setRenderedScale(scale)}
                      />
                </Document>
              </div>
          </SimpleBar>
        </div>       
    </div>
  )
} 

export default PdfRenderer