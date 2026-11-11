// Isolated entry dispatcher; existing Browse implementation remains unchanged.
import React from'react';import{createRoot}from'react-dom/client';
if(new URLSearchParams(location.search).get('skin')==='cinema')import('./Cinema').then(({default:Cinema})=>createRoot(document.getElementById('root')!).render(<Cinema/>));else import('./main');
