const isInApp = () =>{
    const rules = [
        'WebView',
        '(iPhone|iPod|iPad)(?!.*Safari\/)',
        'Android.*(wv|\.0\.0\.0)',
    ];
    const ua = navigator.userAgent || navigator.vendor || window.opera
    const regex = new RegExp(`(${rules.join('|')})`, 'ig');
    return Boolean(ua.match(regex));
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
    backUrl: null,
    bottomAction: true,
    bottomCall: isInApp()? window.location.href: 'default'
}