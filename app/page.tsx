'use client'

import { generate } from '@pdfme/generator'
import {
  Template,
  Font,
  getDefaultFont,
  DEFAULT_FONT_NAME,
} from '@pdfme/common';
import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { FileUpload } from '@/components/file-upload'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
//import { ZodString } from 'zod';

interface RowData {
  [key: string]: string | undefined
}

/* custom font */
const fontObjList = [
  {
    fallback: true,
    label: 'andalus',
    url: '/fonts/andalus.ttf',
  },
  {
    fallback: false,
    label: "algerian-regular",
    url: "/fonts/algerian-regular.ttf"
  },
  {
    fallback: false,
    label: DEFAULT_FONT_NAME,
    data: getDefaultFont()[DEFAULT_FONT_NAME].data,
  },
];

/* gets custom font data from url/file */
export const getFontsData = async () => {
  const fontDataList = (await Promise.all(
    fontObjList.map(async (font) => ({
      ...font,
      data: font.data || (await fetch(font.url || '').then((res) => res.arrayBuffer())),
    }))
  )) as { fallback: boolean; label: string; data: ArrayBuffer }[];

  return fontDataList.reduce((acc, font) => ({ ...acc, [font.label]: font }), {} as Font);
};

/** Template or data schema */
const template: Template = {
  basePdf: '/Template.pdf',
  schemas: [
    [
      {
        name: 'id',
        type: 'text',
        position: { x: 28, y: 581.5 },
        width: 200,
        height: 30,
        fontSize: 45,
        alignment: 'left',
      },
      {
        name: 'name',
        type: 'text',
        position: { x: 100, y: 260 },
        width: 700,
        height: 100,
        fontSize: 95,
        alignment: 'center',
        fontName: 'andalus',

      },
      {
        name: 'birthDate',
        type: 'text',
        position: { x: 255, y: 310 },
        width: 400,
        height: 100,
        fontSize: 95,
        alignment: 'center',
      },
      {
        name: 'diploma',
        type: 'text',
        position: { x: 255, y: 390 },
        width: 400,
        height: 100,
        fontSize: 95,
        alignment: 'center',
        fontColor: "#FF0000",
      },
      {
        name: 'todayDate',
        type: 'text',
        position: { x: 90, y: 560 },
        width: 100,
        height: 10,
        fontSize: 45,
        alignment: 'left',
      },
      {
        name: 'startDate',
        type: 'text',
        position: { x: 56, y: 605 },
        width: 100,
        height: 10,
        fontSize: 45,
        alignment: 'left',
      },
      {
        name: 'endDate',
        type: 'text',
        position: { x: 181, y: 605 },
        width: 100,
        height: 10,
        fontSize: 45,
        alignment: 'left',
      },

    ],
  ],
}

export default function Home() {

  const [rowsData, setRowsData] = useState<RowData[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState<string | null>(null)
  const [newinput, setNewinput] = useState("");

  const processExcelFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const json_data: RowData[] = XLSX.utils.sheet_to_json(worksheet)
      setRowsData(json_data)
      setFileName(file.name)
    } catch (error) {
      console.error("Error processing Excel file:", error)
      alert("Error processing Excel file. Please check the file and try again.")
    }
  }

  const getData = (row: RowData, col: string): string => {
    if (row && row[col] !== undefined) {
      return row[col] as string
    }
    return ''
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/')
  }

  const generatePDF = async (row: RowData): Promise<Blob> => {
    const todayDate = formatDate(new Date())
    const font = await getFontsData();
    const inputs = [{
      id: getData(row, 'id'),
      name: getData(row, 'name'),
      birthDate: getData(row, 'birthDate'),
      diploma: getData(row, 'diploma'),
      todayDate: todayDate,
      startDate: getData(row, 'startDate'),
      endDate: getData(row, 'endDate'),
      x: newinput,
    }]

    const pdf = await generate({ template, inputs, options: { font } })
    return new Blob([pdf.buffer], { type: 'application/pdf' })
  }

  const handleGenerateAll = async () => {
    if (rowsData.length === 0) {
      alert('No data available. Please upload an Excel file first.')
      return
    }

    setIsGenerating(true)
    setProgress(0)

    for (let i = 0; i < rowsData.length; i++) {
      try {
        const pdfBlob = await generatePDF(rowsData[i])
        const fileName = `diploma_${getData(rowsData[i], 'id')}.pdf`
        const link = document.createElement('a')
        link.href = URL.createObjectURL(pdfBlob)
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setProgress(Math.round(((i + 1) / rowsData.length) * 100))
      } catch (error) {
        console.error(`Error generating PDF for row ${i + 1}:`, error)
      }
    }

    setIsGenerating(false)
  }

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4'>
      <h1 className='text-4xl font-bold mb-8'>Welcome to DIPLOMAKER</h1>
      <div className='w-full max-w-md mb-4'>
        <FileUpload onFileUpload={processExcelFile} />
        {fileName && (
          <p className='mt-2 text-sm text-gray-600'>
            Uploaded file: {fileName}
          </p>
        )}
      </div>
      <Button
        onClick={handleGenerateAll}
        disabled={isGenerating || rowsData.length === 0}
        className='px-6 py-3'
      >
        {isGenerating ? 'Generating PDFs...' : 'Generate All PDFs'}
      </Button>
      {isGenerating && (
        <div className='mt-4 w-64'>
          <Progress value={progress} className="w-full" />
          <p className='text-center mt-2'>{progress}% Complete</p>
        </div>
      )}
      {!isGenerating && rowsData.length > 0 && (
        <p className='mt-4'>Total rows: {rowsData.length}</p>
      )}

      <input
      value={newinput}
      onChange={e => setNewinput(e.target.value)}>
      
      </input>

      <Button onClick={()=>{
        const newfield = {
          
            name: 'x',
            type: 'text',
            position: { x: 90, y: 500.5 },
            width: 200,
            height: 30,
            fontSize: 45,
            alignment: 'left',
          };
          if(template.schemas.length ===0){
            template.schemas.push([]);
          }
            template.schemas[0].push(newfield);
        
      }}>
        Add field
      </Button>
    </div>
  )
}

