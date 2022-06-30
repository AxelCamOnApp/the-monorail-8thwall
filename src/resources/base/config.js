/* 
    Hola Persona del futuro que tiene que customizar cosas, este archivo tiene como finalidad setear las opciones de personalización a nivel funcional de monorail
    Al momento de cargar se estableceran los valores base acá establecidos, por favor no los toques ya que afectarán a todas los modelos cargados y será un evento
    muy triste. Te pedimos que copies la estructura y la pegues en tu folder de Customización (en la raíz), sí cuando carguemos el brand pisamos las variables, no es necesario que setes todas,
    solo cambia las que necesites.

    Saludos (probablemente el tú del pasado).
*/

var config = {
    /*
     Define si la visualización es solo en mobile,
       Pro defecto es false haciendo que el modelo se pueda visualizar en desktop 
       al setearlo true se hará visible solo en mobile y en desktop aparecerá un QR (lo mas seguro es que haya que configurar en el custom loader la apariencia del QR)    
       typo: boolean 
    */
    onlyMobile: false,
    /* 
        Define la url del botón de back en la instancia de QR normalemnte usado como fallback para volver a la experiencia 360
        es opcional.
        typo: String|NuLL
    */

    backUrl: null,
    /**
        esto es una prueba 
    */
    bottomAction:false ,

}