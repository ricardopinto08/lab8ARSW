### Escuela Colombiana de Ingeniería
### Arquitecturas de Software - ARSW
### Laboratorio - Broker de Mensajes STOMP con WebSockets + HTML5 Canvas.


Este ejercicio se basa en la documentación oficial de SprinbBoot, para el [manejo de WebSockets con STOMP](https://spring.io/guides/gs/messaging-stomp-websocket/).

En este repositorio se encuentra una aplicación SpringBoot que está configurado como Broker de mensajes, de forma similar a lo mostrado en la siguiente figura:

![](http://docs.spring.io/spring/docs/current/spring-framework-reference/html/images/message-flow-simple-broker.png)

En este caso, el manejador de mensajes asociado a "/app" aún no está configurado, pero sí lo está el broker '/topic'. Como mensaje, se usarán puntos, pues se espera que esta aplicación permita progragar eventos de dibujo de puntos generados por los diferentes clientes.

## Parte I.

Para las partes I y II, usted va a implementar una herramienta de dibujo colaborativo Web, basada en el siguiente diagrama de actividades:

![](img/P1-AD.png)

Para esto, realice lo siguiente:

1. Haga que la aplicación HTML5/JS permita ingresar, a través de dos campos, un valor de X y Y. Agregue un botón con una acción (definida en el módulo de JavaScript) que convierta los datos ingresados en un objeto JavaScript que tenga las propiedades X y Y, y los publique en el tópico: /topic/newpoint . Para esto tenga en cuenta (1) usar el cliente STOMP creado en el módulo de JavaScript y (2) enviar la representación textual del objeto JSON (usar JSON.stringify). Por ejemplo:

	```javascript
	stompClient.send("/topic/newpoint", {}, JSON.stringify({x:10,y:10}));
	```

2. Dentro del módulo JavaScript modifique el método de conexión al WebSocket, para que la aplicación se suscriba al tópico "/topic/newpoint" (en lugar del tópico /TOPICOXX). Asocie como 'callback' de este suscriptor una función que muestre en un mensaje de alerta (alert()) el evento recibido. Como se sabe que en el tópico indicado se publicarán sólo puntos, extraiga el contenido enviado con el evento (objeto JavaScript en versión de texto), conviértalo en objeto JSON, y extraiga de éste sus propiedades (coordenadas X y Y). Para extraer el contenido del evento use la propiedad 'body' del mismo, y para convertirlo en objeto, use JSON.parse. Por ejemplo:

	```javascript
	var theObject=JSON.parse(message.body);
	```
3. Compile y ejecute su aplicación. Abra la aplicación en varias pestañas diferentes (para evitar problemas con el caché del navegador, use el modo 'incógnito' en cada prueba).
4. Ingrese los datos, ejecute la acción del botón, y verifique que en todas la pestañas se haya lanzado la alerta con los datos ingresados.
5. Agregue los cambios al repositorio y haga un último commit de lo realizado usando el comentario "PARTE 1".

	```bash
	git commit -m "PARTE 1".
	```

## Parte II.

Para hacer mas útil la aplicación, en lugar de capturar las coordenadas con campos de formulario, las va a capturar a través de eventos sobre un elemento de tipo \<canvas>. De la misma manera, en lugar de simplemente mostrar las coordenadas enviadas en los eventos a través de 'alertas', va a dibujar dichos puntos en el mismo canvas.

1. Agregue un elemento de tipo [Canvas](http://www.w3schools.com/html/html5_canvas.asp) de al menos 800x600 pixeles.
2. Tenga en cuenta las líneas 21 a 35 de [este ejemplo](http://www.html5canvastutorials.com/advanced/html5-canvas-mouse-coordinates/) para asociar un evento de mouse al canvas. A diferencia del ejemplo, usted lo va a hacer en el módulo javascript, en la sección que se ejecuta cuando el documento se ha cargado por completo ($(document).ready), y usará un evento de tipo "mousedown" en lugar de "mousemove".
3. Haga que el 'callback' asociado al tópico /topic/newpoint en lugar de mostrar una alerta, dibuje un punto en el canvas en las coordenadas enviadas con los eventos recibidos. Para esto puede [dibujar un círculo de radio 1](http://www.w3schools.com/html/html5_canvas.asp).
4. Ejecute su aplicación en varios navegadores (y si puede en varios computadores, accediendo a la aplicación mendiante la IP donde corre el servidor). Compruebe que a medida que se dibuja un punto, el mismo es replicado en todas las instancias abiertas de la aplicación.

5. Haga commit de lo realizado, y agregue un TAG para demarcar el avance de la parte 2.

	```bash
	git commit -m "PARTE 2".
	```

## Parte III.

Para la parte III, usted va  a implementar una versión extendida del modelo de actividades y eventos anterior, en la que el servidor (que hasta ahora sólo fungía como Broker o MOM -Message Oriented Middleware-) entrará a coordinar parte de los eventos recibidos, para a partir de los mismos agregar la funcionalidad de 'dibujo colaborativo de polígonos':

![](img/P2-AD.png)

Para esto, se va a hacer una configuración alterna en la que, en lugar de que se propaguen los mensajes 'newpoint' entre todos los clientes, éstos sean recibidos y procesados primero por el servidor, de manera que se pueda decidir qué hacer con los mismos. 

1. Cree una nueva clase que haga el papel de 'Controlador' para ciertos mensajes STOMP (en este caso, aquellos enviados a través de "/app/newpoint"). A este controlador se le inyectará un SimpMessagingTemplate, un Bean de Spring que permitirá publicar eventos en un determinado tópico. Por ahora, se definirá que cuando se intercepten los eventos enviados a "/app/newpoint" (que se supone deben incluir un punto), se mostrará por pantalla el punto recibido, y luego se procederá a reenviar el evento al tópico al cual están suscritos los clientes "/topic/newpoint".

	```java
	
	@Controller
	public class STOMPMessagesHandler {
		
		@Autowired
		SimpMessagingTemplate msgt;
	    
		@MessageMapping("/newpoint")    
		public void getLine(Point pt) throws Exception {
			System.out.println("Nuevo punto recibido en el servidor!:"+pt);
			msgt.convertAndSend("/topic/newpoint", pt);
		}
	}

	```
2. Ajuste su cliente para que, en lugar de publicar los puntos en el tópico /topic/newpoint, lo haga en /app/newpoint . Ejecute de nuevo la aplicación y rectifique que funcione igual, pero ahora mostrando en el servidor los detalles de los puntos recibidos.

3. Una vez rectificado el funcionamiento, se quiere aprovechar este 'interceptor' de eventos para cambiar ligeramente la funcionalidad:

	1. Se va a manejar un nuevo tópico llamado '/topic/newpolygon', en donde el lugar de puntos, se recibirán listas de puntos.
	2. El manejador de eventos de /app/newpoint, además de propagar los puntos mediante el tópico '/app/newpoints', llevará el control de últimos 4 puntos recibidos(que podrán haber sido dibujados por diferentes clientes). Cuando se completen los cuatro puntos, publicará la lista de puntos en el tópico '/topic/newpolygon'. Recuerde que esto se realizará concurrentemente, de manera que REVISE LAS POSIBLES CONDICIONES DE CARRERA!.
	3. El cliente, ahora también se suscribirá al tópico '/topic/newpolygon'. El 'callback' asociado a la recepción de eventos en el mismo debe, con los datos recibidos, dibujar un polígono, [tal como se muestran en ese ejemplo](http://www.arungudelli.com/html5/html5-canvas-polygon/).
	4. Verifique la funcionalidad: igual a la anterior, pero ahora dibujando polígonos cada vez que se agreguen cuatro puntos.
	
	

## Parte IV.

La aplicación antes planteada tiene un grave defecto: sólo se puede hacer un dibujo a la vez, y la colaboración está restringida a un único grupo, compuesto por TODAS las personas que usen la aplicación en cierto momento.

1. A la aplicación, agregue una API REST en la que se pueda manejar el recurso 'dibujos', y que tenga como subrecurso:
	* Los identificadores de los diferentes dibujos: /dibujos/{iddibujo}.
	* Los colaboradores asociados a dichos dibujos: /dibujos/{iddibujo}/colaboradores


2. Ajuste el código del servidor, de manera que en lugar de sólo procesar los mensajes enviados a '/app/newpoint', pueda manejar eventos asociados a cada dibujo en particular. Para esto, puede manejar una convención de nombres donde un sufijo permita identificar a qué dibujo va cada punto, y permita por lo tanto llevar un control adecuado de cada uno de éstos  (por ejemplo: /app/newdibujo.23232, /app/newdibujo.48482). Para ver cómo manejar esto desde el manejador de eventos STOMP del servidor, revise [la sección 26.4.9 de la documentación de Websockets en Spring](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/websocket.html).



3. Ajuste el cliente para que, en lugar de hacer automáticamente la suscripción a un determinado tópico, permita al usuario:
	* Crear un nuevo grupo, ingresando un identificador para el mismo.
	* Unirse al grupo recién creado, o a uno previamente registrado, indicando su nombre, realizando entonces la suscripción correspondiente.
	
	Igualmente, ajuste los nombres de los tópicos manejados en los clientes, de manera que se maneje la misma conveción de nombres (por ejemplo, /topic/newpolygon.223232, para indicar que el evento de creación del polígono irá sólo a los clientes que estén trabajando en el dibujo 223232).

4. En cualquier momento, al realizar la consulta al recurso /dibujos/{iddibujo}/colaboradores, se debe poder identificar quienes están (o han estado) colaborando en un dibujo. OPCIONALMENTE, puede agregar un nuevo tópico dedicado al evento de 'nuevos colaboradores del dibujo {iddibujo}', suscribir a los clientes el mismo (para que actualicen un listado de colaboradores), y hacer que el API rest, cada vez que reciba una petición PUT para agregar un nuevo colaborador, notifique de esto a los interesados.

5. A partir de los diagramas dados en el archivo ASTAH incluido, haga un nuevo diagrama de actividades correspondiente a lo realizado hasta este punto. Exporte este diagrama en formato PNG, e inclúyalo en su entrega con el nombre "DIAGRAMA_ACTUALIZADO.png"


5. Haga commit de lo realizado, y agregue un TAG para demarcar el avance de la parte final.

	```bash
	git commit -m "PARTE FINAL".
	```	


## Opcional

Igualmente puede revisar -DE FORMA OPCIONAL-:

Puede ajustar su cliente para que, además de eventos de mouse, [detecte eventos de pantallas táctiles](http://www.homeandlearn.co.uk/JS/html5_canvas_touch_events.html), de manera que los clientes móviles también puedan interactuar con la aplicación!.


### Criterios de evaluación

1. La aplicación propaga correctamente los puntos entre todas las instancias abierta de la misma, cuando hay sólo un dibujo.
2. La aplicación propaga correctamente los puntos entre todas las instancias abierta de la misma, cuando hay más de un dibujo.
3. La aplicación propaga correctamente el evento de creación del polígono, cuando colaborativamente se insertan cuatro puntos.
4. La aplicación propaga correctamente el evento de creación del polígono, cuando colaborativamente se insertan cuatro puntos, con 2 o más dibujos simultáneamente.
5. El API muestra los clientes que trabajan, o han trabajado en un determinado dibujo.
4. En la implementación se tuvo en cuenta la naturaleza concurrente del ejercicio. Por ejemplo, si se mantiene el conjunto de los puntos recibidos en una colección, la misma debería ser de tipo concurrente (thread-safe).
5. [Puntos opcionales] La aplicación acepta eventos táctiles.
"# lab8ARSW" 
