/*
 * jQuery plugin xbsCarousel.js
 *	Version: 2.0
 *	Author: xavier bs
 *	Website: murviel-info.com
 *	Date: Feb, 2015
 *	Licence: Free
 * Structure:
 * <div id="carousel">
		<img src="path/to/img" />
		<div class="content_carousel">
			<p class="carousel_titre"><a href="url">titre</a></p>
		</div>
	</div>
	Script: $( '#carousel' ).xbsCarousel();
*
*	Joindre le fichier carousel.css
*/
( function( $ ) {

	var isTouch = false;
	if( Modernizr.touchevents ) {
		isTouch = true;
	}

   $.fn.xbsCarousel = function( options ) {
      var defaults = {
	      responsive: {
	         0: {
	            items: 1
	         },
	         400: {
	            items: 2
	         },
	         800: {
	            items: 3
	         },
	         1200: {
	            items: 4
	         },
	         1600: {
	            items: 5
	         }
	      },
	      gutter: 4,
	      // durations
			diapoDuration: 5000,
			diapoSlideDuration: 1200,
			// nav dots
			dots: false
		};
		
      // Merges options
      var param = $.extend( true, defaults, options );

		return this.each( function( index ) {
			
			// Carousel 
			var $car = $( this ),
				 $ref = $( '.overview_carousel', $car ),
				 $art = $( 'article', $car ),
				 highlightDots = function() {};
			
			// Carousel margin-right
			var car_marginLeft = parseInt( $car.css( 'margin-right' ) ) - param.gutter;
			$car.css({ marginRight: car_marginLeft + 'px' });

			// Responsiveness
			var match,
				 number_items, // Number of visible items
				 car_width; // carousel width 
			$( window ).on( 'resize', function() {
				car_width = $car.width();
				match = 0;
				$.each( param.responsive, function( key ) {
					if( key > match && key <= car_width ) {
						match = Number( key );
					}
				});
				number_items = param.responsive[match].items; // visible items
				width_img = car_width / number_items;
				$art.css({ width: ( width_img - param.gutter ) + 'px', marginRight: param.gutter + 'px' });
				highlightDots();
			})
			.trigger( 'resize' );

			// Interval
			var diapoInterval = [];

			// images loaded
			$ref.imagesLoaded().progress( function( imgLoad, image ) {
				$( image.img ).css({ visibility: 'visible' });
				$( image.img ).parent().removeClass( 'loader_carousel' );
			});

			// creates dots
			if( param.dots ) {
				$art.each( function( index ) {
					$( this ).data( 'dots', index );
				});
				$car.append( '<div class="xbsDots"></div>' );
				$navi = $( '.xbsDots' );
				for( var i = 1; i <= $art.length; i++ ) {
					$navi.append('<span />');
				}

				var $spans = $( 'span', $navi );
				// active dots for visible articles
				highlightDots = function() {
					$spans.removeClass( 'active' ); 
					$( 'article', $car )
					.slice( 0, number_items )
					.each( function() {
						$( 'span', $navi ).eq( $( this ).data( 'dots' ) ).addClass( 'active' );
					})
				}
				highlightDots();
			}
			
			var tween = { kill: function() {} };
			var scrolling = function( duration, ease, right ) {
				var ease = ease || Power3.easeOut;
				var margin = right ? 0 : -width_img;
				tween = TweenLite.to( $ref, duration, { 
					marginLeft: margin,
					ease: ease,
					onStart: function() {
						$ref.addClass( 'gsap' );
						$navi.children( "span:last" ).prependTo( $navi );
					},
					onComplete: function() {
						$ref.removeClass( 'gsap' ).css({ marginLeft: 0 });
						if( ! right ) $( 'article:first', $ref ).appendTo( $ref );
						highlightDots();
					}
				});
			}
			
			var retiming = function( right ) {
				var right = right || false;
				scrolling( 0.5, Power4.easeOut, right );
			}

			// lance l'interval
			var startInterval = function() {
				var duration = param.diapoSlideDuration / 1000;
				var tempInterval= setInterval( function() { scrolling( duration ); }, param.diapoDuration);
				diapoInterval.push( tempInterval ); 				
			}

			// reset de l'interval
			var resetInterval = function() {
				for ( var i= 0; i < diapoInterval.length; i++ ) {
					clearInterval( diapoInterval[i] );
				}
			}
			

			// Mouse enter, move, leave
			// Le carousel suit la souris
			var mouseX0, mouseX, first_id = 0,
				 marginLeft0 = 0, move = 0, k = 0, nextLeft = false, nextRight = false,
				 direction, prevMove, mouse, hold = false;

			var start = function( mouse ) {
				resetInterval();
				marginLeft0 = parseInt( $ref.css( 'margin-left' ) );
				tween.kill();
				$ref.css({ marginLeft: marginLeft0 });
				mouseX0 = mouse;				
			}

			var travel = function( mouse ) {
				if( hold ) return;
				mouseX = mouse - mouseX0;
				move = mouseX + marginLeft0;
				direction = ( move - prevMove > 0 ) ? 'right' : 'left';
				marginLeft = move + k * width_img;
				
				if( nextLeft ) {
					$( 'article:first', $ref ).appendTo( $ref );
					nextLeft = false;
				}
				else if( marginLeft < -width_img && ! nextLeft ) {
				 	k++;
				 	nextLeft = true;
				}
				else if( nextRight ) {
					$( 'article:last', $ref ).prependTo( $ref );
					nextRight = false;
				}
				else if( marginLeft > 0 && ! nextRight ) {
					k--;
					nextRight = true;
				}
				$ref.css({ marginLeft: marginLeft });
				prevMove = move;
				highlightDots();
			}

			var end = function() {
				if( ! hold ) {
					k = 0;
					var dir = direction == 'right' ? true : false;
					retiming( dir );
				}
				highlightDots();
				startInterval();
			}

			$car
			.on( 'mouseenter', function( e ) {
				mouse = e.pageX;
				start( mouse );
			})
			.on( 'mousemove', function( e ) {
				mouse = e.pageX;
				travel( mouse );
			})
			.on( 'mouseleave', function( e ) {
				end();
			});

			// Démarrage du carousel
			setTimeout( startInterval, 100 );

			if( isTouch ) {
				$car
				.on( 'tapstart', function( e, touch ) {
					// console.log( 'start: ' );
					mouse = touch.position.x;
					start( mouse );
				})
				.on( 'tapmove', function( e, touch ) {
					// console.log( 'move: ' );
					e.preventDefault();
					mouse = touch.position.x;
					travel( mouse );
		      })
				.on( 'tapend', function( e, touch ) {
					e.preventDefault();
					// console.log( 'end: ' );
					end();
	        	});
			}
			
			if( isTouch ) {
			// Shows caption on taphold
				$art.on( 'taphold', function( e ) {
					e.preventDefault();
					hold = true;
					var $content = $( '.content_carousel', this );
					$content.slideDown( 200 );
					setTimeout( function() {
						$content.slideUp( 200 );
						hold = false;
					}, 2000 );
				});

				$( 'a', $art ).on( 'tap', function( e ) {
					location.href = e.target.href;
				});
			}

		});
			
	}
})( jQuery );
