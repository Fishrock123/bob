# Profiling information

This is a summary of data collected in order to understand the perfomance impact
of the 'bob' APIs.

Extra info:
- System: Ubuntu 16.04 LTS 64bit. Node.js 10.0.0-pre.
- Hardware: i7-7700k with z170, 2400mhz DDR3 RAM, 7200 RPM HDD over 6GB/s SATA.
- File: Guild Wars 2's `Gw2.dat` file, ~38GB.

Notes:
- System is too fast to get CPU profiling info on small files.
- HDD is limiting factor, time can't be reduced much.

## Profiles

### `file-to-file-test.js` with JS PassThrough

[Profile using 38GB file](profiles/f2f-bob-big-prof)

Output from `/usr/bin/time`:
```
17.55user 76.40system 8:13.28elapsed 19%CPU (0avgtext+0avgdata 39356maxresident)k
72205056inputs+74950112outputs (1major+12411minor)pagefaults 0swaps
```

### `file-to-file-test.js` with C++ PassThrough

[Profile using 38GB file](profiles/f2f-bob-c++-big-prof)

Output from `/usr/bin/time`:
```
23.99user 83.17system 8:24.33elapsed 21%CPU (0avgtext+0avgdata 40016maxresident)k
72204632inputs+74950616outputs (1major+12268minor)pagefaults 0swaps
```

### `file-to-file-test-old.js` (Streams3)

[Profile using 38GB file](profiles/f2f-streams3-big-prof)

Output from `/usr/bin/time`:
```
41.70user 118.49system 9:12.61elapsed 28%CPU (0avgtext+0avgdata 104132maxresident)k
77866712inputs+83341208outputs (1major+73866minor)pagefaults 0swaps
```
