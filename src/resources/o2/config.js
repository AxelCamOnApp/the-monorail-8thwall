function returnRightUrl(){
    if(location.search.includes('-uk-iphone')){
        return 'https://o2.camonapp.com/o2-uk-iphone/'
    }else if(location.search.includes('-uk-ipad')){
        return 'https://o2.camonapp.com/o2-uk-ipad/'
    }else{
        return 'https://o2.camonapp.com/produkte'
    }
}

config = {
    /*
     Define si la visualización es solo en mobile,
       Pro defecto es false haciendo que el modelo se pueda visualizar en desktop 
       al setearlo true se hará visible solo en mobile y en desktop aparecerá un QR (lo mas seguro es que haya que configurar en el custom loader la apariencia del QR)    
       typo: boolean 
    */
    onlyMobile: true,
    /* 
        Define la url del botón de back en la instancia de QR normalemnte usado como fallback para volver a la experiencia 360
        es opcional.
        typo: String|NuLL
    */
    backUrl: returnRightUrl(),
}