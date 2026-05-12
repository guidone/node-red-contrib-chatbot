
**Facebook Messenger** API talks to **RedBot** via a https callback (a self signed certificate is not enough). We’ll use [ngrok](https://ngrok.com/) to create a https tunnel for our local **Node-RED** instance. Install it, then open a shell window and run

```bash
ngrok http 127.0.0.1:1880
```

You should get something like

![ngrok](https://prod-files-secure.s3.us-west-2.amazonaws.com/b55ba134-c1dd-4ca1-9942-d1fe66c465a2/a888bc1b-0672-4e91-a3c1-1daa9ca4afc8/facebook-1.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466RRSAZEGU%2F20260512%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260512T122955Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGQaCXVzLXdlc3QtMiJHMEUCIBJKMv11Ss6gsH54CVKvdpmVcXd1OPNB85as9KD9yty0AiEAhEasGbeYgZcs%2B4JEhcURnUllh0YerP169jP8TkKTt2kq%2FwMILBAAGgw2Mzc0MjMxODM4MDUiDHvPB8sjgMWah3z1nCrcA7Te7vBFCGnMs8XpQ1%2FvYKSOfSy3uT8HZPmycRYvEeWQJWX1YSXqMrvetMJPCUYVyU%2BmsT%2Fvy8wHNnuAGz0cPd8ZdREX%2FC6I97Pex69NDTbFQO4BdOqeOuCW3J7d6YrxjUxMJat7FHM0JdHRl52UTJqrn6RhRTy%2FTgI8h2BobRk8E6%2B1oOlpteJmKiJPewg5vSgj7XCBndeHG5f5H0P3sX0Ur%2Byt6SojOLVyc7mSqU7wsUfz%2BedQqUwn6IRLR1UJgQKKGMq7altqgAu7ou34aXucPm8051LQAkC%2BwT8DmS41fiMszMmOjE1wbwo29pEEreCg4JXAFHal4HBC49oeczWXHp2CqjX7YuANkarwzPW0E3p5Y8Y5hL72yQvFi8dk6Mynl3cvonfLC5H6rBBANJDe2pvi7ttsWM%2FYhmLUpwSmCJgjrTd5S%2FpPXtAekrxMES8tjqnpITyErd9%2BzLlnNJhKFFyM%2FNKOAflkbt5LMIii8vxvGyNcQ06OHXRgilHYXZRhxgOFpaApVEsMIfAu%2BhIwH%2FNpXcJO0oZOTj2PzuZop07sgOWnauz3KLCNm2iPXbM5fIVyz9D%2FVwd95sUfEiPozhAEbua6Bq%2BqH4KNmIuqPIRFL3EUoo3jzCNlMM%2BdjNAGOqUBIRs32T6b0UFReFK3BhYwgjRjQ5PUrHZK33sfcA23PCs0th1ZGoDyLKgai1pHnCiNWMADmtszSN0%2F54Oa46xf203UmYHbv5FGEahIfQIXPRLrXjr0krOwAQFUpghqoUgN0bPmC1GMYscOXSUrjxevH69ZVbc9QIAKVRVnvl%2BKdemC5mF5aJYrX4d5%2Ffz%2FTLtPloblT4Pdix4Imayl%2BiJCF2xzAtYT&X-Amz-Signature=7b5086372730b5181515dbc53d0879126aabec38aede70e1b20563e69a6185ef&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Grab the https address you get, something like _https://123123.ngrok.io_, this is the base url that points back to your **Node-RED** instance.

The callback is

```plain text
http://youraddress.ngrok.io/redbot/facebook
```

Replace the hostname (_youraddress.ngrok.io_) with what you got above. [Start here](https://developers.facebook.com/apps/create/) to create a new **Facebook** app, select type _None_.

In the app _Dashboard_ go to the _“Add products to your app”_ and add **Messenger** 

![](https://prod-files-secure.s3.us-west-2.amazonaws.com/b55ba134-c1dd-4ca1-9942-d1fe66c465a2/e3f96e27-a89f-4f9d-89d0-f95c5cd62e4c/Markup_2023-01-15_at_22.55.06.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466RRSAZEGU%2F20260512%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260512T122955Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGQaCXVzLXdlc3QtMiJHMEUCIBJKMv11Ss6gsH54CVKvdpmVcXd1OPNB85as9KD9yty0AiEAhEasGbeYgZcs%2B4JEhcURnUllh0YerP169jP8TkKTt2kq%2FwMILBAAGgw2Mzc0MjMxODM4MDUiDHvPB8sjgMWah3z1nCrcA7Te7vBFCGnMs8XpQ1%2FvYKSOfSy3uT8HZPmycRYvEeWQJWX1YSXqMrvetMJPCUYVyU%2BmsT%2Fvy8wHNnuAGz0cPd8ZdREX%2FC6I97Pex69NDTbFQO4BdOqeOuCW3J7d6YrxjUxMJat7FHM0JdHRl52UTJqrn6RhRTy%2FTgI8h2BobRk8E6%2B1oOlpteJmKiJPewg5vSgj7XCBndeHG5f5H0P3sX0Ur%2Byt6SojOLVyc7mSqU7wsUfz%2BedQqUwn6IRLR1UJgQKKGMq7altqgAu7ou34aXucPm8051LQAkC%2BwT8DmS41fiMszMmOjE1wbwo29pEEreCg4JXAFHal4HBC49oeczWXHp2CqjX7YuANkarwzPW0E3p5Y8Y5hL72yQvFi8dk6Mynl3cvonfLC5H6rBBANJDe2pvi7ttsWM%2FYhmLUpwSmCJgjrTd5S%2FpPXtAekrxMES8tjqnpITyErd9%2BzLlnNJhKFFyM%2FNKOAflkbt5LMIii8vxvGyNcQ06OHXRgilHYXZRhxgOFpaApVEsMIfAu%2BhIwH%2FNpXcJO0oZOTj2PzuZop07sgOWnauz3KLCNm2iPXbM5fIVyz9D%2FVwd95sUfEiPozhAEbua6Bq%2BqH4KNmIuqPIRFL3EUoo3jzCNlMM%2BdjNAGOqUBIRs32T6b0UFReFK3BhYwgjRjQ5PUrHZK33sfcA23PCs0th1ZGoDyLKgai1pHnCiNWMADmtszSN0%2F54Oa46xf203UmYHbv5FGEahIfQIXPRLrXjr0krOwAQFUpghqoUgN0bPmC1GMYscOXSUrjxevH69ZVbc9QIAKVRVnvl%2BKdemC5mF5aJYrX4d5%2Ffz%2FTLtPloblT4Pdix4Imayl%2BiJCF2xzAtYT&X-Amz-Signature=2c23b78dc3030cd2b4a48bf7b7624daa5c8760d2729994df4d74d2fafb424b50&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Your **Facebook** app must be connected to a _Facebook page_, go to the _Access tokens_ section and click on the _Add or remove Pages_ (or create a page if you don’t have one).

After the page has been linked to the app, click on _Generate token_, then grab it.

![](https://prod-files-secure.s3.us-west-2.amazonaws.com/b55ba134-c1dd-4ca1-9942-d1fe66c465a2/e78902ab-d486-4a11-b196-cfe5273e8b21/Markup_2023-01-15_at_23.02.42.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466RRSAZEGU%2F20260512%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260512T122955Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGQaCXVzLXdlc3QtMiJHMEUCIBJKMv11Ss6gsH54CVKvdpmVcXd1OPNB85as9KD9yty0AiEAhEasGbeYgZcs%2B4JEhcURnUllh0YerP169jP8TkKTt2kq%2FwMILBAAGgw2Mzc0MjMxODM4MDUiDHvPB8sjgMWah3z1nCrcA7Te7vBFCGnMs8XpQ1%2FvYKSOfSy3uT8HZPmycRYvEeWQJWX1YSXqMrvetMJPCUYVyU%2BmsT%2Fvy8wHNnuAGz0cPd8ZdREX%2FC6I97Pex69NDTbFQO4BdOqeOuCW3J7d6YrxjUxMJat7FHM0JdHRl52UTJqrn6RhRTy%2FTgI8h2BobRk8E6%2B1oOlpteJmKiJPewg5vSgj7XCBndeHG5f5H0P3sX0Ur%2Byt6SojOLVyc7mSqU7wsUfz%2BedQqUwn6IRLR1UJgQKKGMq7altqgAu7ou34aXucPm8051LQAkC%2BwT8DmS41fiMszMmOjE1wbwo29pEEreCg4JXAFHal4HBC49oeczWXHp2CqjX7YuANkarwzPW0E3p5Y8Y5hL72yQvFi8dk6Mynl3cvonfLC5H6rBBANJDe2pvi7ttsWM%2FYhmLUpwSmCJgjrTd5S%2FpPXtAekrxMES8tjqnpITyErd9%2BzLlnNJhKFFyM%2FNKOAflkbt5LMIii8vxvGyNcQ06OHXRgilHYXZRhxgOFpaApVEsMIfAu%2BhIwH%2FNpXcJO0oZOTj2PzuZop07sgOWnauz3KLCNm2iPXbM5fIVyz9D%2FVwd95sUfEiPozhAEbua6Bq%2BqH4KNmIuqPIRFL3EUoo3jzCNlMM%2BdjNAGOqUBIRs32T6b0UFReFK3BhYwgjRjQ5PUrHZK33sfcA23PCs0th1ZGoDyLKgai1pHnCiNWMADmtszSN0%2F54Oa46xf203UmYHbv5FGEahIfQIXPRLrXjr0krOwAQFUpghqoUgN0bPmC1GMYscOXSUrjxevH69ZVbc9QIAKVRVnvl%2BKdemC5mF5aJYrX4d5%2Ffz%2FTLtPloblT4Pdix4Imayl%2BiJCF2xzAtYT&X-Amz-Signature=dee4676aece73ef91f50fcd206e644524cd08c45169179711f9ad14b948b10b8&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Go to the _Webhooks_ sections and click on _Add Callback URL_ and put the ngrok URL you got before (i.e., _https://123123.ngrok.io/redbot/facebook_), put anything on _Verify token_ and then click on _Verify an save._

Switch to the _Settings_ → _Basic_ section and grab the _App secret_.

Now switch to **Node-RED,** drop and connect a `Messenger Receiver` node, `Text` node and `Messenger Sender` node and connect like below

![](https://prod-files-secure.s3.us-west-2.amazonaws.com/b55ba134-c1dd-4ca1-9942-d1fe66c465a2/97ba3329-452b-41da-bb0f-2a433999d004/Screenshot_2023-01-15_alle_23.13.18.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466RRSAZEGU%2F20260512%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260512T122955Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGQaCXVzLXdlc3QtMiJHMEUCIBJKMv11Ss6gsH54CVKvdpmVcXd1OPNB85as9KD9yty0AiEAhEasGbeYgZcs%2B4JEhcURnUllh0YerP169jP8TkKTt2kq%2FwMILBAAGgw2Mzc0MjMxODM4MDUiDHvPB8sjgMWah3z1nCrcA7Te7vBFCGnMs8XpQ1%2FvYKSOfSy3uT8HZPmycRYvEeWQJWX1YSXqMrvetMJPCUYVyU%2BmsT%2Fvy8wHNnuAGz0cPd8ZdREX%2FC6I97Pex69NDTbFQO4BdOqeOuCW3J7d6YrxjUxMJat7FHM0JdHRl52UTJqrn6RhRTy%2FTgI8h2BobRk8E6%2B1oOlpteJmKiJPewg5vSgj7XCBndeHG5f5H0P3sX0Ur%2Byt6SojOLVyc7mSqU7wsUfz%2BedQqUwn6IRLR1UJgQKKGMq7altqgAu7ou34aXucPm8051LQAkC%2BwT8DmS41fiMszMmOjE1wbwo29pEEreCg4JXAFHal4HBC49oeczWXHp2CqjX7YuANkarwzPW0E3p5Y8Y5hL72yQvFi8dk6Mynl3cvonfLC5H6rBBANJDe2pvi7ttsWM%2FYhmLUpwSmCJgjrTd5S%2FpPXtAekrxMES8tjqnpITyErd9%2BzLlnNJhKFFyM%2FNKOAflkbt5LMIii8vxvGyNcQ06OHXRgilHYXZRhxgOFpaApVEsMIfAu%2BhIwH%2FNpXcJO0oZOTj2PzuZop07sgOWnauz3KLCNm2iPXbM5fIVyz9D%2FVwd95sUfEiPozhAEbua6Bq%2BqH4KNmIuqPIRFL3EUoo3jzCNlMM%2BdjNAGOqUBIRs32T6b0UFReFK3BhYwgjRjQ5PUrHZK33sfcA23PCs0th1ZGoDyLKgai1pHnCiNWMADmtszSN0%2F54Oa46xf203UmYHbv5FGEahIfQIXPRLrXjr0krOwAQFUpghqoUgN0bPmC1GMYscOXSUrjxevH69ZVbc9QIAKVRVnvl%2BKdemC5mF5aJYrX4d5%2Ffz%2FTLtPloblT4Pdix4Imayl%2BiJCF2xzAtYT&X-Amz-Signature=ff48e7ed9a6a5626ce8aeda8d2401d9a032b5a6da8eb91f5ea5b3120e169402e&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Don’t forget to configure the `Text` node (i.e., set the text _“Hello world!”_).

Double click on the `Messenger Receiver` node and create a new configuration, use the values saved before: _Access token_, _App secret._

![](https://prod-files-secure.s3.us-west-2.amazonaws.com/b55ba134-c1dd-4ca1-9942-d1fe66c465a2/1a50d9db-119e-438e-a9ee-965132ea61e4/Markup_2023-01-15_at_23.18.04.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466RRSAZEGU%2F20260512%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260512T122955Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGQaCXVzLXdlc3QtMiJHMEUCIBJKMv11Ss6gsH54CVKvdpmVcXd1OPNB85as9KD9yty0AiEAhEasGbeYgZcs%2B4JEhcURnUllh0YerP169jP8TkKTt2kq%2FwMILBAAGgw2Mzc0MjMxODM4MDUiDHvPB8sjgMWah3z1nCrcA7Te7vBFCGnMs8XpQ1%2FvYKSOfSy3uT8HZPmycRYvEeWQJWX1YSXqMrvetMJPCUYVyU%2BmsT%2Fvy8wHNnuAGz0cPd8ZdREX%2FC6I97Pex69NDTbFQO4BdOqeOuCW3J7d6YrxjUxMJat7FHM0JdHRl52UTJqrn6RhRTy%2FTgI8h2BobRk8E6%2B1oOlpteJmKiJPewg5vSgj7XCBndeHG5f5H0P3sX0Ur%2Byt6SojOLVyc7mSqU7wsUfz%2BedQqUwn6IRLR1UJgQKKGMq7altqgAu7ou34aXucPm8051LQAkC%2BwT8DmS41fiMszMmOjE1wbwo29pEEreCg4JXAFHal4HBC49oeczWXHp2CqjX7YuANkarwzPW0E3p5Y8Y5hL72yQvFi8dk6Mynl3cvonfLC5H6rBBANJDe2pvi7ttsWM%2FYhmLUpwSmCJgjrTd5S%2FpPXtAekrxMES8tjqnpITyErd9%2BzLlnNJhKFFyM%2FNKOAflkbt5LMIii8vxvGyNcQ06OHXRgilHYXZRhxgOFpaApVEsMIfAu%2BhIwH%2FNpXcJO0oZOTj2PzuZop07sgOWnauz3KLCNm2iPXbM5fIVyz9D%2FVwd95sUfEiPozhAEbua6Bq%2BqH4KNmIuqPIRFL3EUoo3jzCNlMM%2BdjNAGOqUBIRs32T6b0UFReFK3BhYwgjRjQ5PUrHZK33sfcA23PCs0th1ZGoDyLKgai1pHnCiNWMADmtszSN0%2F54Oa46xf203UmYHbv5FGEahIfQIXPRLrXjr0krOwAQFUpghqoUgN0bPmC1GMYscOXSUrjxevH69ZVbc9QIAKVRVnvl%2BKdemC5mF5aJYrX4d5%2Ffz%2FTLtPloblT4Pdix4Imayl%2BiJCF2xzAtYT&X-Amz-Signature=784b21ec0f9302db0e105a207bda439b37b68ebe5aef45662e6767e5aa1921ae&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Select also the newly created configuration in the `Messenger Sender` node.

Now open [messenger.com](http://messenger.com/), create a new message and select as recipient the page previously selected, write anything, you should receive an _“Hello world!”_.

If you get an error means that you have used wrong parameters (access token, app secret, etc) or, for some reason, Facebook APIs cannot reach the your callback url.

To exclude the second option and be sure that your **Node-RED** instance works correctly, grab your **ngrok** url and open this address

```plain text
http://youraddress.ngrok.io/redbot/facebook/test
```

If you get an _“ok”_ then **Node-RED** is up and running. 

`Messenger Receiver` and `Messenger Sender` nodes have a double bot configuration for _development_ and _production_. By default is used the _development_ configuration. To use _production_ configuration, edit **Node-RED** settings file (_settings.js_) and set the _environment_ global variable to _“production”_. See [Deploying RedBot](https://www.notion.so/c0c2de46b48a4def837753c7e284b356) for more details.
