import{Home,Compass,LayoutGrid,Building2,PanelsTopLeft,Package,Bookmark}from'lucide-react';
import{MunkeeStudioIcon}from'../munkee-studio/MunkeeStudio';
export const defaultDestinations=[['Home','#/home',Home],['Catalogue','#/home?section=videos',Compass],['Exchange','#/home?tab=exchange',LayoutGrid],['Houses','#/home?section=houses',Building2],['Board','#/board',PanelsTopLeft],['Extensions','#/appearance',Package],['MUNKEE STUDIO','#/munkee-studio',MunkeeStudioIcon],['Saved','#/home?section=saved',Bookmark]]as const;
