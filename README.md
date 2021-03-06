# Emergent Taxis

A javascript visualization for Emergent Taxis (a swarm of low-capable robots finds a light source)

## Where to find the visualization? 

[`Click here!`](https://tristndev.github.io/Emergent-Taxis/)

[![Screenshot](screenshot.png)](https://tristndev.github.io/Emergent-Taxis/)

* Simply hit `start / freeze` to observe the swarm locate the light beacon.
* Hit `reset` to start a new run.
* Hit `download data` to download csv data for an executed run.
* Use the controls on the top right to experiment with parameters.
  * `n_agents`: Number of agents
  * `unit`: Unit size
  * `alpha`: Target fraction of agents to have within communication range.
  * `r_avoid_light`: Agent avoidance radius in light.
  * `r_avoid_shad`: Agent avoidance radius in shadow.

## What is *Emergence*?

Emergence describes 'how stupid things get smart together' (after a great [kurzgesagt video](https://www.youtube.com/watch?v=16W7c0mb-rE)).
Think: A single ant is not capable of much, but a whole ant colony can achieve impressive things.

## What is *Emergent Taxis*?

We will observe a swarm of minimalist, low-capable robots slowly moving towards a light source. Each individual agent is not capable of doing so, but together they can locate the light (hence the *emergent*). 

### Additional Resources on Emergent Taxis

Read original papers and find additional information here:

> Julien Nembrini, Alan Winfield, Chris Melhuish. *Minimalist Coherent Swarming of Wireless Networked Autonomous Mobile Robots.* Proceedings of the seventh international conference on simulation of adaptive behavior on From animals to animats, pages 373–382, Cambridge, MA, USA, 2002. MIT Press. 

> J. D. Bjerknes, A. F. Winfield and C. Melhuish, *An Analysis of Emergent Taxis in a Wireless Connected Swarm of Mobile Robots*. 2007 IEEE Swarm Intelligence Symposium, Honolulu, HI, 2007, pp. 45-52, https://doi.org/10.1109/SIS.2007.368025.

> Heiko Hamann, Heinz Wörn, *A framework of space–time continuous models for algorithm design in swarm robotics*. Swarm Intelligence 2, 209–239 (2008). https://doi.org/10.1007/s11721-008-0015-3
