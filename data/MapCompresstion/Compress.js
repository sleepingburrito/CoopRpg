function CompressMap( mapCsv )
{
    //make dictionary
    let pharseNum = mapCsv.split(", ");
    let arrParsed = [];
    let dic = [];
    for( let i = 0; i < pharseNum.length; i++ )
    {
        const tmpNum = parseInt(pharseNum[i]);
        arrParsed.push( tmpNum );

        let found = dic.find( function(element) { return element.num === tmpNum; });
        if ( found === undefined )
        {
            dic.push( { num: tmpNum, count: 1 } );
        }
        else
        {
            found.count++;
        }
    }

    //sort it to do "Huffman coding"
    dic.sort( function( a, b ) { return b.count - a.count; } ); 

    //index bookeeping so I can use find and get the index
    for (let i = 0; i < dic.length; i++ ) 
        dic[i].index = i;

    //replace values with smaller dictionary ones
    for( let i = 0; i < arrParsed.length; i++ )
    {
        const find = arrParsed[i];
        let found = dic.find( function(element) { return element.num === find; });
        arrParsed[i] = found.index;
    }

    //runlength encoding
    let outputArray = [];
    for( let i = 0; i < arrParsed.length; i++ )
    {
        let repeetCount = 0;
        let find = arrParsed[i];

        //count repeating data
        for( let i2 = i + 1; i2 < arrParsed.length; i2++ )
        {
            if ( find === arrParsed[i2] )
            {
                repeetCount++;
            }
            else
                break;
        }

        if ( repeetCount > 3 ) //only worth storing if saving atleast 3 spots
        {
            outputArray.push( -repeetCount );
            outputArray.push( find );
            i += repeetCount;
        }
        else
            outputArray.push( find );
    }

    //return values
    return  {
                dictionary: dic,
                data: outputArray
            };
}

console.log( JSON.stringify( CompressMap(cm) ) );

function DecompressMap( mapObj )
{
    function UndoRunLength( source )
    {
        let deflate = [];
        let repeat = 0;
    
        for( let i = 0; i < source.length; i++ )
        {
            if ( source[i] < 0 ) //run length is encoded as a negative number, next element is the number to repeat
            {
                repeat = -source[i];
            }
            else if ( repeat < 1 ) //this is non repeated data
            {
                deflate.push( source[i] );
            }
            else if ( repeat > 0 ) //deflate repeated number
            {
                for( let i2 = 0; i2 <= repeat; i2++ )
                    deflate.push( source[i] );
    
                repeat = 0;
            }
        }
    
        return deflate;
    }
    
    function UndoDictionary( source, dictionary )
    {
        let undid = [];
        for( let i = 0; i < source.length; i++ )
        {
            undid.push( dictionary[ source[i] ].num );
        }
        return undid;
    }

    return UndoDictionary( UndoRunLength( mapObj.data ), mapObj.dictionary )
}
