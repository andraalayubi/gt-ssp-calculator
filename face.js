let totalWorldLock = 0;
let totalSSP = 0;
$(document).ready(function () {


    $("button#calculateBtn").click(function () {
        totalSSP = 0;
        totalWorldLock = 0;

        calcFace("CaveColumn");
        calcFace("Door");
        calcFace("GlassPane");
        calcFace("Grass");
        calcFace("LavaRock");
        calcFace("MartianTree");
        calcFace("Sign");
        calcFace("WoodBlock");
        calcFace("AmberGlass");
        calcFace("Bricks");
        calcFace("CrappySign");
        calcFace("Daisy");
        calcFace("HappyJoy");
        calcFace("Mushroom");
        calcFace("RockBackground");
        calcFace("Rose");
        calcFace("SuperCrate");
        calcFace("Terracotta");
        calcFace("Torch");
        calcFace("Wheat");
        calcFace("BlackBlock");
        calcFace("BrownBlock");
        calcFace("CliffSide");
        calcFace("GreyBlock");
        calcFace("MiniBlocks");
        calcFace("MudGlob");
        calcFace("PointySign");
        calcFace("RedBlock");
        calcFace("WoodBackground");
        calcFace("WoodenPlat");
        calcFace("AquaBlock");
        calcFace("DangerSign");
        calcFace("EvilBricks");
        calcFace("GreenBlock");
        calcFace("RockPlatform");
        calcFace("StoneWall");
        calcFace("Poppy");
        calcFace("WhiteBlock");
        calcFace("Window");
        calcFace("WoodenTable");
        calcFace("YellowBlock");
        calcFace("BarnBlock");
        calcFace("BrickBackground");
        calcFace("CavePlatform");
        calcFace("FloweryWallpaper");
        calcFace("GlassBlock");
        calcFace("Grimstone");
        calcFace("RedBricks");
        calcFace("Toilet");
        calcFace("DeathSpikes");
        calcFace("DungeonDoor");
        calcFace("Pencil");
        calcFace("RedWoodWall");
        calcFace("BarnDoor");
        calcFace("Bush");
        calcFace("DevilHorns");
        calcFace("ExclamationSign");
        calcFace("OrangeBlock");
        calcFace("RuneCarvedStonePillar");
        calcFace("SheetmBlank");
        calcFace("Stalactite");
        calcFace("Stalagmite");
        calcFace("TexasLimestone");
        calcFace("DwarvenColumn");
        calcFace("HouseEntrance");
        calcFace("DinkDuck");
        calcFace("YerfDog");
        calcFace("StripeyWallpaper");
        calcFace("WoodenWindow");
        calcFace("Barrel");
        calcFace("CheckerWallpaper");
        calcFace("DarkBrownBlock");
        calcFace("DarkGreyBlock");
        calcFace("DarkRedBlock");
        calcFace("RedGlassBlock");
        calcFace("Sidewalk");
        calcFace("TenementBuilding");
        calcFace("Tomato");
        calcFace("WindowCurtains");
        calcFace("WoodenChair");
        calcFace("Blueberry");
        calcFace("DarkAquaBlock");
        calcFace("DarkGreenBlock");
        calcFace("RomanticBush");
        calcFace("Staircase");
        calcFace("WaterBucket");
        calcFace("WesternBuilding");
        calcFace("Bathtub");
        calcFace("BigOldDownArrow");
        calcFace("BigOldSidewaysArrow");
        calcFace("DarkYellowBlock");
        calcFace("SheetmDrums");
        calcFace("TigerBlock");
        calcFace("TwistedSpikes");
        calcFace("Bed");
        calcFace("BiohazardSign");
        calcFace("BubbleWrap");
        calcFace("Dresser");
        calcFace("SaloonDoors");
        calcFace("SheetmPiano");
        calcFace("VineyBlock");
        calcFace("VineyWallpaper");
        calcFace("WesternBanner");
        calcFace("AirDuct");
        calcFace("BlueBlock");
        calcFace("LatticeBackground");
        calcFace("OldeTimeyRadio");
        calcFace("Orange");
        calcFace("PolkaDotBlock");
        calcFace("SecretPassage");
        calcFace("SheetmFlatPiano");
        calcFace("SheetmSaxNote");
        calcFace("StreetSign");
        calcFace("Tangram");
        calcFace("DarkOrangeBlock");
        calcFace("Gargoyle");
        calcFace("Portcullis");
        calcFace("SheetmFlatSax");
        calcFace("AncientStoneGate");
        calcFace("ArrowPlacard");
        calcFace("Cactus");
        calcFace("PicketFence");
        calcFace("ScreenDoor");
        calcFace("BlueStarWallpaper");
        calcFace("CuzcoWallMount");
        calcFace("DasRedBalloon");
        calcFace("Foliage");
        calcFace("Plumbing");
        calcFace("SaltBlock");
        calcFace("Sandstone");
        calcFace("Apple");
        calcFace("Command-Move");
        calcFace("ForSaleSign");
        calcFace("IceCrustBlock");
        calcFace("PurpleBlock");
        calcFace("SheetmFlatElectricGuitar");
        calcFace("SheetmFlatFlute");
        calcFace("SheetmFlatLyre");
        calcFace("SheetmFlatMexicanTrumpet");
        calcFace("SheetmFlatSpanishGuitar");
        calcFace("SheetmFlatViolin");
        calcFace("OutieBlock");
        calcFace("RusticFence");
        calcFace("SchoolDesk");
        calcFace("AirVent");
        calcFace("AncientBlock");
        calcFace("GemSign");
        calcFace("Seaweed");
        calcFace("SwissCheeseBlock");

        $("#sspAmount").text("= "+parseFloat(totalSSP).toFixed(2));
        $("#wlAmount").text("= "+parseFloat(totalWorldLock).toFixed(2));
    })

})

function calcFace (idName) {
    const amountId = "#amt"+idName;
    const priceId = "#price"+idName;

    // $(priceId).css("background-color", "green");        //test if this function is called and id's correctly put in
    // $(amountId).css("background-color", "green");

    const amountNb = $(amountId).val();     //amount of seed
    const priceNb = $(priceId).val();       //price of seed


        if (priceNb > 0)        //checks if price is set
        {
            if (amountNb > 0)   //price set && amount filled in.
            {
                let tempTotalWorldLock = amountNb / priceNb;
                totalWorldLock = totalWorldLock + tempTotalWorldLock;
                $(priceId).css("background-color", "white");
            }


            const exisistingText = $("#noPrice").text();
            if (exisistingText.includes(" " + idName))
            {
                const newText = exisistingText.replace(idName+", ", "");    //removes "prices not set" thingy
                $("#noPrice").text(newText);
            }

        } else {
            if (amountNb > 0)           //price NOT set & amount been set, prevent empty counting as price not set
            {
                $(priceId).css("background-color", "red");
                const exisistingText = $("#noPrice").text();

                if (exisistingText.includes(" " + idName))
                {

                }else {
                    $("#noPrice").text(exisistingText + idName+", ");
                }
            } else {        //removes "prices not set" thingy if no amount and price
                const exisistingText = $("#noPrice").text();
                if (exisistingText.includes(" " + idName))
                {
                    const newText = exisistingText.replace(idName+", ", "");
                    $("#noPrice").text(newText);
                }
            }

        }
    let tempssp = amountNb / 5;
    totalSSP = totalSSP+tempssp;

}