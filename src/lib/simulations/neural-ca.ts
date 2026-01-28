import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';
import * as twgl from 'twgl.js';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'neural-ca',
  name: 'Neural Cellular Automata',
  description: 'Self-organizing neural network that grows and regenerates patterns',
  width: 800,
  height: 600,
  targetFPS: 60,
};

const CHANNEL_N = 16;
const MAX_ACTIVATION_VALUE = 10.0;
const GRID_SIZE = 1024;
const STEPS_PER_FRAME = 32;

const PRETRAINED_MODEL = [
  {
    data_b64: "iGhijXVuZXJyTmZ2oV1LfUOCkVNNOV6OfBGObboykXg8aWJgd2mTa4efXU2PVIDARJhbT0tjkJZddV2QkHqTamODPGiATH6JanSJjpagSIxBP3lch4t9cV9bkVlaa6Vnj3RkfEypkYKeaG2Pi5CYgkyGYludrm9ceYmVfFpulYORaKRUiHKZW59WcU9iXopnjXaLf5CieZxVj2SJaKdra5SFcXeXjGVwY2aUhWSBYX1rbHCKjXWKfpt7bnqGYoddXFtPYWpggYJtfnFna2RiiB5jm3yOcoiDim2WcneZjWl0aZ1sk4qOeXdhgWeEkmNdlGpgRGOWeYZzO6JeoYxpdGGMo46Uk5Z+dlx0ko98nJtDjadQizl6Zq0ycISfS0domrGgU4mHfoNwdJudhI1cY3l8epR6eHBfin1mVJdUjH6BcVdWsbOYso+aS42lQY+PajOhYH6UfX+mO4aQYKxTmq5tSWRWdkV1SXKXa0xQjX5NeCJZVk16oEkZYZ+AfIdke5pphIF0ZIpfR3WAdYR+W4ZRYnxvgnxuemRreXyUholuX3hne1hsTHOXYHiMbnZ9a31vaH5xXVRlW4aBb4ZYVpSAkHB+QVllfXRreWeYiW9VoayDYlVtZXKTnJOIl4OJTYZqg3mFV4qKY3tlbViCeJBulZp2n6Fyfgxyf6hrhmh+do5CbWR1fGabgqOLmYGKmLBpXph7oW+Oc0p3ipmZXYN0XH19ipuDQ2VlVlFTbYtqVoBvi1t/glWnaV10VIeQZn5SkVd6ZGeDh1ZmdXuchHp3YIKCtHiFWXxzb2qJhI91d3FthYtriXeLgJR5hWNecH9LjIuJnm98W3mHgopwY019iHNLdWxnc26lejZbsY6Rpl+zjoN+mGKfj3VsUKx/YGyKhUx0pFx6e2lgWHmhcnGKekqng3uQhoZonohwZI1NgZx1dHaIYVOBdo6BhKuIkIZzklZydZudW3d9eXNTcoiIoJ9ijGSnh3t+bG6RgZSenYCSd3l5bpqBbZSCgXeifGKXUYBlcqRmkoNZmmSGjo2gcp6PcZSDgU9/jaWVY2praJGDbWJnZ1CGgnaSomWYZV6ScWxSe3uKXTaCZIemdHdnYZiAb3dldHmQX2l6gYSjkIt8S45Yblpta1Rzflx0XImAcWZLl4ebdIZic5+Mdm9adJ10b3hrmZx+fHBncYhfg21kUHGDdHp6m3uKa3KDjlyliIGcY2ZThWx7joKPcW+dTWB0im5xNWR2bmSbmnJ2W7JkdFVna1qJO36xqKSdcneWe2R/dIpdvpaWgouToKaco1Z3iIRTVoZ2c6CEl2B+dGlAVpFcbFpVZXZnjWB9dICKj413loRFlpNeTn9jW2VvfmZlYF9/f5hLXFpdVmdziJY+dpFfblmGi31uZ2N4UJN7aohxdX1VbphJl52AfotyVIWBTUB4bIN/b25iPmBqeo6EfVaSlJyEVVF3XGNmiIKGcXdpbEpjj21xlJSNlZVcRos9nVR6jX+GeVRreFGSgXx6RoZ9WGaEf5JxZ2o7f3OTWFNxc2J8Ylh6h31WfGd9hFt5WVNRgoIoO3Gbd3Ztb4aLW1ZAj2BpRjN+YW5liU+iTHU9WluRbn19kGZQljltfJJmcWV5m3F1Zo1lcF2BWGNohGB5S3plhUF+X0lQfFhxXDqEf52PYGuNjo56XZ9jcWJokayFTXxjcpRvRiZ5mFxWjG59Z3CRS3eRYkldoWR0jXiYY3FwimVOmUZ5dIBeenWKoXBtf2hykn1wi4OPfZF3o3CKn3aBbXyDUoOPR5SBQ4RcaKeGmpWBjHGlkbSEhEVyhmBrg293lHiEomeOYnWTd2KIaHSFnnKgb2Vlg31nr2dveYZ0amlflYFjmWpkeF9rVlVmZ3GOdJBogJp8SlSFeVBZc2uCg2B4koCGXG1bYVtXiohJYkt7m3OIkJt+l1haYomJdWZ6gItZYoWBa5hYi3JzcHGUZ3aJY4dvY2WDdW96jFmGdF5jW4dUfphhYE1mbW1ldYJUaJZuel1aV4WCfZNshT2Zmn6LbGlGc4RpVn9/cHpokJRzjHJ0bMBXj6mTgYVwkYy5bndrsYdxpbaKrI1+bpaKboSVlY5xr2V9oGp6h1VxsGaYgZmLRlOOe2OJUm2JV46UhamOl37Rd4yReoB8kXiRRIOKiVWadX9pf2GbX2WDYX6RroKeaXqyn7KLf5xmd3p5Ulxen5Zug1uelICRppBhyZaScoeX5KtPnmd0rZ+ogqmJcKKhjm2Jq5iYgJ98h45Mh41bcKJumFVnnHyjcY2DbdGZjW18g2OBuWB1mrBuv8OGbHXSiuBymsmbbXKpm3hyYpN2k4xigo63bXBjbXJYjqxzhmSVf4d/rn15f4msp42cf6qIyIOCfnhpe197f4pWdYVpdYd5e26OZYxzcmaFm2udX4JtW5OAcYFWSWFai3p3W3R0fmd9YlN2jp+Ee4ObepZeNadgZo5Dk5FVfWxVX4pbZphzb3ipbmyVjE1+mGJcjG6OdotihXSUeHF9U25zd25/ZY6AfmlqU4FWdoqXoFePaYZSZoePfGuJnn53e4Bmj4iOf7FldFyFY3CNeWuHkmt+jYl4l4ZuaW9zWn+Hpod9naCfT1uWopmrhYp0Zq+OXmeWhItbZWV8dV98lomRlYRoxYrIcIF+iX2coaZ7gYyadpWhkJCVm5yPZZtxb5+Xe06Es26UULx6noR3h5J3bIOJfXaOm6FfYqNrloOOcJdknIBvq35UTaWKkI+DeGWQnWySg5egdF2Oio+ahl1LqXyTn3+zirF5hoVVmYurf1OpgpqYUahaqIF5rmVoinCSaXyfp2drj310VF2PgoZ4eL9qqJFBaG6yhWGEqHmdsJaHb3GSqKyLl4SXeJJwe6icmpWKRJ+pi2SZZYxiaZ53eHR7rVWSkHt/qWluq3VkpnCloX2VZJJpUXiHql9ng1SxTn+OfX+BgJZuZH5tZoJ9T5qmmJyDfF9vr5uPlmmFr5mXnI+BjZhdfqNQdpWjU3ZggX1yoYR9onFjcoGXo3OTem6AnoWGt2l/ZpWMc3SnfHKDmJyJpHuNWXqFZ5Zonzl4aZuOX32Oen5vpm6bco1Ta2NkXlWNkYNif3y1iF+Wbo+DiJtrpHOuWp5WnFeMa6RrUUaPdW2KX5WflICvnk+Vf3OuiIJzh4N1hI+JeHGBaq+YVZKkf4mCk4VtdWiAdZ95oXuMgLebXIR5iXpvf76efIOgiGKSmGidlHhklJZknGdtj3hlkI5jYI9YcW13aHKcoX5lg5dmgHt4dqGNZHE1dVNdmHKVa7F+cWxzp2KMiZCrnIOeeXRrgJNxXntdpKuJYHB4lVuGfnN2SnSXipWdeYZhZ6JUkoKthXh8W424kZpukphfjZqcn6N8mHlKiJpndp2OjEZIVHaEiINvvpKvjV6LU5qLdKGgr3RsSmabW5h/fnNMpEurdGKpmnFAoYt7hIJbcl+scYxpgW2CLUWVe1NzxlWQdXBsg2ZCV5WbeK2Vcmhbi3GEfUdMtj6ATp6NlLTXmHArYWCwsVFmjKJZkY+ldYaddqt9hVuTuWCAYEJnikfFP0ljxZNrWYHGgaSPoWZ2lHeef6pVXqKWXYmhV3CNinOEyotNflxMvlKljpGUe2OLYK1slphvTn5cOCt1UW6KVs+Aqp5tbkFbb8aMrWpTaWhqi46oJlqmSoF6iKR5lIqTXjNtaY6QJKdetkCOg4R5aJM7p5pZdJe5erqDfESfcJ1rcpZ/Ym+FnKJOoJhjg6Vzom6IsWV/VlJlk7l5iaZfi4F0nKeTlICIW36bUXhwULCUiXZNPZBmSVOHYcWjjoNetJhxkHSDQThhZUzJdmeAZJZ3Z4ZaiHh2SXzMYp91PLBkQYBuunBTYLrKk2pBoqSuZGqjiItXvtCCYKuGUpA9uFNWn3FwO3B73oZfUaZxd6uOu3tBelSNbXyseGxZaHxgeqSOXnWjPq2SoXx4b7xhh82tbWJkblmUXl6rhohdU4OahYujPW9TgmQ4mcyhSnZqjIZgW02MotCXnopwqJB29lZibUmsgkVo07eKkIeSqZiCTnWkfIaIxn1nhYWLpKZ9jpyAiCrZjXaOa2FHX2yfa4+WOWdxOWZsjmRXoJrBUUunk05MkGqOvWBvVpaPUo1rgY6HX21qlGthrm9rj7mhhWSwcrZ0aHs/jdGmi2WqipFwenqdWmyZlNk0lEWVZmuVgj6W0n8/jGV4jap7r6WUc2SPr5FJhqGmpZiWhmBlg2pbf5LEfJSVjpJ2rmp2Wcx5ZJefgHt7eVGGgp5ylcGSbGtyrmR1dYSbnXVnj11NR6Z3k1KbVpihhW2bVGlvvn24d35fbl1UQmJDyomSemeRiopyaYRVjIlGUW5+YWqCYG1cNrJ/hKkwd3/QdTV+YpN6b4mBbm9CqKVdVKylmIlzorCgqKlStnN5mG1xfmRwonBvgoGcrpRwhU9edZyXaFk8o4VgTaRypXCEWXhGb2W2arZ1kJqlVmaCmIeCk4jDb4WyjI2QgXqsiIiicqh9kXl2PptbunWAeJyKa5OMhXF4gl50l4t4ZsSRi+ivpYijunKEZdKTmaCyzI52t25loLFehIacW2tcSLKXfWyBeYGuYHh6ciiILJqMTmOjZH6/iVSbVlB0e7HEnJ+NY51FgHuBhp+pn0Z0XqV9qYYofqhch4VshLtsSkS6VX23kniEbKtCgEofZ3RcvY2cbjalg1jAS6Nyu3ZdVlaoqqxneZqNeJKohIqggoitZmZ/z6WhrE96jpFroJiLeIJqTYV7dHHLbsZ1CuKnzISNe014W01IwI9yPs6OsIqZpFGYUVu6qm6yi4ZHa4t8hll9kG9xkql0gY+gqXRGfZFbdYWStnRhf26idlKgcG9OsnaBooJ0mlieXku4TR1tiZGzf3q/ibbJo6dyqJOskXG3AK+EbGWjjVJaflploXymmoiToXWJqJxyL3GMZ2i1gaNYmGVUlqFoeGiJqYaWdr56h7p4sZteZldhlF+KUbp8hk5JakezdY92c4SQVjh0q3+FaqaviZJyhX5yVW+gWE+MwLt7RG17cpltiGuqgFJ4fLE8hm1+ca9ugJOOf2x1kJpeaJ+cZIeQVZGTnoOihHK5n6mtiXxsoZBgSpagjIh9YFubo3WfXUaadm+np4ybrmRlWG1obpGqWaeYtXGKVnVgt3GdnMG6ooeri71SZ3pyRpWAkmWjhHR2eGW4OnJ6d7xinHFke5BUYEyGcrlbXo+gzZuKgna8lqBf2mxoc5nUtXasiG+npt+ArLphlXJotK5kLae2coy8iKxOO3JygJdcUIvCf3iDXqaHZq6svJN7Y1RYhZN3bWGGiHaPYF+bnJvAjke1cWqjjnWHx45RcNCOZq90hHuYp2ukg5SHqFeRmYqGdLReYs2Ufl2FkGaJiKi1mW+VmcGbmKlxlqGopLqier+Yc63ChmRuclxudJ+ymLZ7goejfIhzcEtsaGaEXE92a1hWrGSPUZOjZsBzo4mIe6xdYmyYiaF6mIBqnrZ2k1hyXm1/nHOMlGOPqWlqXYtjlqpPjXiPfIBmT4uIjrCfjHmjeHdglleUW4meaYh3ZpWkmnVscJCGi1GLtYmRdWtabYSOmWmCa5JtfmmamY+WlGBUcod6rWtzUIVhb6GOgWyRnnF5Ua2VfZx9gmemYH18fIOCYGZdXYtujHyWi1V8UVhVapB2gminVqCUdI2jQGdXb1BtZapodmZ9hWpPbGWTd3lgk3agXYZQT5CXSKWDZ3t1dIWMjY5+WGl2YZp2f4qJeW5nfmB/kqN/YV+ujYuWXHd1g5t/jjlQM1uDjGZ1knWScJJMUpyBX12OlH5hm4iCjWx/lUmpfHV9jqqGdZaPbXZ2dY5To6xUsJ2SeGtoiq19al2Yf2iicVZPSU6Ma42rUHOKWWt0crd/cHiZWaCRg3uHh0yqc1abgpNrenJhc2yqa3ldT4ealHJ/YXyXlnNpgoZ9a36ZgWWAcJ5oqIFfdnV1Y5hmmLpqeX2LqJqAjKFgb3RbioV9hX9NeYFZVoZli4ddjF6ldXGvjFmUlW93V5ZWfqCbboWKglyNZ3hha4drpISAaFhvknWPkIGldXqFmoRDjoB5g4CChGyTj26Cl3BtoWZSmyBqSY6VlGq7cMZRqERdVm1RlUZhWaK1tq9/eEmAqz2AsfJPiVpFq5zBoZp6zF+wzK2RNjq4g2lLopVun2l8hcUte3NdPpatnXmOnZFTZ1ydXnlHT2pgPUSpsopBpLJNhZpwfonEqzyFi5FshGSCVnB3YItZiGB1hKlFf311pG+CiFtuk0lfe5qF23h3aa2CgUxx3nqYhlbFf6CGlDKPUJBul1hDUomlxqluUGqFfbSmtm0wd6d5qIuogpFzhJVbl0mcQ01zcqObLCKtl0ubZVZQoLBnj0d2Y5eDwWGOmmRttXNjbaauVGBwlG+YOY1bcYOKj1hyToV+lpZJX3+MY4d2fJhklkNHvm6ggrw5nnlIXY59TH9VjpHKh194o6g/r23rfItnZ56snDrEWYqPrKjGepxcvTt3Wp+jZE2hS4+uTHdtUUWTgXVrso5oQmN1iDePTWiEjz1ef39ZbImCk2GTb7Sll5U8mVatVn3AazSJZIdolFWRrTebZpyhhJ1voaSUgWCEOXelfswwmjWIkYCUnMh8ZmJ5vHSxUoiOpSqaz5FzdmVbpHOQjKFgkoqIi7WjaEKIbptgc2qNgZBwb4xHnFFiUYRPn3mErF1Vd5yJhE/AOmAwQkuAcYtInWZZe46njmnFrJ6OaWh0kkSBTZxEom9ybaa4fqtvsW+OeZhuhqFJWVejnHRqqE9eV6NdhiaMcklPgq6umpWJalWpRJ1tulehipl5wrhxSIBsjV50o5tccs56bld1gpGobW+ChTeXnVp2kJ+RRUCJlmJ+sFmWc2xoWl5oS76LgT9+j0tmmYFtWZ2Lg3+Yb5lEPXWCoYt7e1tzeKAilGxlf5NPdrhyeYYkeYCTpJWIWGxYhVyFiW2BYmNJrqOAeWqGopdlxZiCPoFbc5aLlmzKUZ1vuYOJk0mJrHWUZEpmfV9me4B3YW2DV1iIrmCEV61cU4WIhntXnH5xcmRtYqlYS6p+XltobpNNr2pnpJhsQoJ7VlSKcZN5aj+KiXF4YJyAlLCeh7Grbp1TdqmZlxWNZauHsqJpSTiVkFi0lpFkfG1xJ2uKcYCmm6WFsXmCcZhiP3eYYq+jiZZ+nIZfTHhzil6xdISCnG57NF0qVGSaiJFonIpIg3NDcoyacaFUk3ujSkiLiX1dnldKfp2ednFwYreqmKGydYyWgJptrSiXxJu5e4SNgn5lU2uAdKeEOjyPeo2cemqBV2lmQ4mIW5Oag5+MLYmNfEOwdqenjFx1j3BkhUVyjZNdV7qbqmJzaF94UaqLhFZcvLFsapeDinOZWVRzqGxkSVxjUC53SGOPa5BfKmZVkYaBfIqQdpqAi3uLhFaGiaNajWx4oWuhRne4nXOSOGSCi4x5tI5NqGeXsnlIWUmJPaBukXO1vtiT0KiMo5VYvVNbqH2VW6LIgG6ys2qtnnOOa6ohY2GCVHd2UslhopdBWG6BeXCVvZOun6y4S4ZeZZSBXJORjXGytYuwcHiSVYJ4o2BWXL6CW4p8uI1jqnpilr6ZV6aTqHd8emZWaJCjhklggWhYvFqnhjhnPnNScIKvcF2arKB6yYpioF9VV1+HSm9tQYhGwqtki5p7hoRre3N+gk2nc5dSi7ydWFxoap2FjD55T2WckJmsW4RejjVhjKB1al7AXL1jk6uFjJiKbm5amXeNeVxiaqBAnLJvi12QfH6AcUNRh31ciJA8qUaHwIdwh25zraWKXpmGUHOagoalOZmSrZ6wqGTCf3yWTcyCi8B9xGqPp3ZxjYS6lZJnwpd+UZt7rFuGm4PMWKJ7lJuEaGFYcniBmHKEvmuUs0SodZpOkLKTir1ysoiLcYOXoWmHilWBn5OHfaZbfM1dWZmqk3Sbj7mfdKVQYpisW5rGmlxOnNCLtYSBp4WIc4aRgnd7lpOkqaBsToNxcYxvemNVw7KZcaykSHpek4uBXaapiot0l5GBV4h6WamLgWCksqmTj0aUR2NdWp+1Xoe1WJtrqE+Nao2EiJWVll56Tnhzi3N+glijrHiRu4uqjLubjqJqxqi4goVdkU9Uq2M+H3RWk5BrQG9li690VHuEUWKKmbR5fX1fd42WbS3FpkOCj5B6OI17f5mhinE6iH+Shmo+X5mRiIKOXn+XWY6Gen9lXn4khoGafYJ7b4RGhm+Mik6ThXxvbX9dNJmLSplvWnubdHy0aWt0eXiOaVxbfmZ2dmJ3AE9reYhegj17WqA=",
    in_ch: 48,
    out_ch: 128,
    weight_scale: 1.3162267208099365,
    bias_scale: 0.4913739264011383,
    type: "uint8"
  },
  {
    data_b64: "ZXBucHuHk4SbiZqSeH17rISNeY9zZndrj2SElHFsi4p3cWN1W2t1f4V5pXqRhIN6Zm9mb4G0j6qXj5aYsHaQl42Gi4OgnXydeaJyjV+IfIeHioKSm5p8WrWZnHljjo1olYKTfYJklG2imXeps45ZioiTg5WIbm9ZenmAeVSGi4GUiY+GlI2ouZGclrCMXqOLlJKLmXB1epdngYB7cIlmd3NbaEhgfX5wi5KPaHN6mn5rgmKMbpSbk5epi5JiZXJ5eoV7iIapeoF9d21tV2trdouLho9yqYSkrJKDr4yian2Vh36CiUuEWI6JqmmcdKuNfIltj3RnbGV+hLVtXFJ0bKiNpIO2gpqTyqmDgX12mXx7iXWWMl1NxHJ6kL+JVYmdZ3llgoqcbWVPaYyQY7CAhHRZdT9GYXqEkXB6not+h6ySin2MYn1je3qJj25XdYpxk3+kdnGCj5plsV/Oi59xoHCHbJ5MaW59g66SdlpcdHRneG6Hn352hJijhJWhd6F0aGhbZHa/s7XUknuaT3izb6uUnoakb5qOklhhd0hudoh8cX1fiJpujlGHpW1WXV9+lJKIk3B5aluJnbyTbmh0eV9vbXFohWiFbYdsh4WDYYSofZ9zTalhfKFLsVyLdpySeHKUa3x4vnaJmIBud4yVV3uAhH6+hJizwbmCul9+bkpud1iBgqehm8d9hY6Oca59eHpveX95gXM9bahdcXNXV2tlWlSDdZShaHd1glNxb2OCkHucgJhenHqjeYBSWW5qdXh3dWyQlaOFpIKaSV9zhoCVbKSCjoNMm5+VeCVVqKKilJuSd2N8eGx+dGuck4OVfYdulae7nqSDfX5WnpG2kI6OlIi8hcmOe6JsbkiNj291coRthXuUl21kcnOAjHhwfIh9kqiNgHRRn2mjf8VzVJiMjYiSsnqOeqeKNmaBVnNudG9yc5ZbeXhVYn2SfWiVkYuKhcePfWxtmYJ4UpdrVHyFho6AZ3ZSenaecKWVfnZyf4KEi2WAqYKcf2t+VYxTnYyXf5CNlo1faXR2ZntwqWp+b4GUfpqmhLmAjIlloJWCd4p0g4ZxXZFadF1uqpN+anFjeHaUdom0mnSMa3aqaXxyg2qCT5iMe4pfxMNxnXehhpt2rU/NfoqZb6FgrmpgiYyZj3x4dXLDi26DXJxZmX2HiJOJhnOHhb5mW7J/dGmKiXqQwnR/jKl6aImji4ZqgYx+kkg8a4h3jn+XXl9dlYaNhJSJfKLGYmxkaZSJW3RxY4BNj1eChXJke5ahcoGIZnpigHlllFiFgo1+dnl5hHR3f3d+m4VOtISjmIV3l4eNj5mecodebZiSj6h8uKOLh4yFknxogl6RZ1hdp41uf4aFhYyOnYuXfLazdbiDl3d/fIV7fZN5iL+jV5xjkICgnI2cgI9ek2haZ4RxkGpkgp6mqLFxdGJiUT2ieo1yhp9pdWh5pZaKhId8WmBpml5WjJt4rn16d7TFj4HOm32Hl32RdJylaZSCeaxuk7ptvI9ziW6XnZOoYH5yREiBYoFVgHeDdG+JfoJNR3V7qKN5dXt/c4mbo3RDr6h/Poh1uHSJl4yfl65WXXBqcFd7WHdxgIGEgJF9mJGHvZmqWXWchH18fH55hn1wdn1/YE6Qc2F7e5RxgGiMdqOckbRxi5molYVzdp2ClZqXrne9kmqZfZCLlIp5eHlyfXV7kmxziIqUp3+4tq+LkbTFgKpjbK9zsIa1bnx1bGCdt5Gjepp/gHttblqkhH96f6BzmIdzUnt3aYNjW0h8inWDs5G9g5WDi4aRiaSxxK2ekHmWhnJvTm6TbrRHfG+BipZbYpCKX3RufHaDopGEip5/ZVpejGNgtqS9jp9ad7d3jXeZWV5wgIKJbJOef4qGvoxxZHVSbGifi6mAk42md2yojouDempgbWd1YHaQgH6GiYyUno2RhZSLh42de511acx1m3OzfleSiomDlJV7kXBnfraAbF2AemliYHmOfHproHpvkIaCgm6GhJWAnIpeYLNOn6COYGiKh4x+nJyJoF6bbJBoT255XXRjfodjlG1ueWJQfqJvZpWSkJC+cZNVwp+BkHxknnGHcZJni4h3UXSWbXqEk5KBfpOGoYNWgY+Mk21WrWV1f395kYNppJ6gncCQnnuNfnJtc3xyeHmZc0h3fWx1kopnkHycc4uUiKCobGqMxo6EnHV3cHZkWHWCfnGgn4OHgXpveYx2hHJ0mmlqiXWDa6aVoJ+fonBbjph1w6ewk3e1wpOIgoJpa3+HiW9/uophcomBoIGvVFyEg35Xlapsa1KKi4eQh4aWemyegXxpU3GJeYKOjZV9cltzkFl2eIZvebx1gHqBg2+GkYidnZR1dZGCl5yNpo9eV0+KnI+WgJJmfop0lGdpf4Z8Xk9yn5d/epCElJOfhFiGW2tchV6Icm59n4uefsWAhmqNkYx8apOQeH6DfH+toZ60rMKHpJGPt4F3fYKInoyAh/9/j4eJdp1wbmWMVm5wo4Z6c42FdHVxcoBzd2dweYJ/knWHiWV1qoWJjX6Vgnygja+jkJqQXrCOf519smpfXqBqnm6tV2iIapqzn8qoT3huakWLTodzf294g32GdXF6e42ff5d3Xm6Jg4Z/iHCLiX9gdnxIql/TpHxneVd6d3mAg2xncJeEeoOTh5KCh3+OnHNtkZuKWKONmpF+hqlshpWfj6KDgmJ/gVddXVNtnpifa7iAmVBWj42GyXn/lHYpf5UyZVeUkj6m",
    in_ch: 128,
    out_ch: 16,
    weight_scale: 1.15468430519104,
    bias_scale: 0.21424207091331482,
    type: "uint8"
  }
];

const VS_CODE = `
  attribute vec4 position;
  varying vec2 uv;
  void main() {
    uv = position.xy * 0.5 + 0.5;
    gl_Position = position;
  }
`;

function defInput(name: string): string {
  return `
    uniform Tensor ${name};
    uniform sampler2D ${name}_tex;
    vec4 ${name}_read(vec2 pos, float ch) {return _read(${name}, ${name}_tex, pos, ch);}
    vec4 ${name}_readUV(vec2 uv) {return _readUV(${name}, ${name}_tex, uv);}
  `;
}

const PREFIX = `
  precision highp float;
  struct Tensor {
    vec2 size;
    vec2 gridSize;
    float depth, depth4;
    vec2 packScaleBias;
  };
  uniform Tensor u_output;
  
  vec4 _readUV(Tensor tensor, sampler2D tex, vec2 uv) {
    vec4 v = texture2D(tex, uv);
    vec2 p = tensor.packScaleBias;
    v = tan((v - p.y) * p.x);
    return v;
  }

  vec4 _read(Tensor tensor, sampler2D tex, vec2 pos, float ch) {
    vec2 p = fract(pos / tensor.size);
    ch += 0.5;
    float tx = floor(mod(ch, tensor.gridSize.x));
    float ty = floor(ch / tensor.gridSize.x);
    p += vec2(tx, ty);
    return _readUV(tensor, tex, p / tensor.gridSize);
  }

  vec2 getOutputXY() {
    return mod(gl_FragCoord.xy, u_output.size);
  }
  
  float getOutputChannel() {
    vec2 xy = floor(gl_FragCoord.xy / u_output.size);
    return xy.y * u_output.gridSize.x + xy.x;
  }

  void setOutput(vec4 v) {
    vec2 p = u_output.packScaleBias;
    v = atan(v) / p.x + p.y;
    gl_FragColor = v;
  }

  ${defInput('u_input')}
`;

const PROGRAMS: Record<string, string> = {
  paint: `
    uniform vec2 u_pos;
    uniform float u_r;
    uniform float u_brush;
    void main() {
      vec2 diff = abs(getOutputXY() - u_pos + 0.5);
      diff = min(diff, u_output.size - diff);
      if (length(diff) >= u_r) discard;
      vec4 result = vec4(0.0);
      if (u_brush > 0.5) {
        float ch = getOutputChannel();
        result = vec4(vec3(float(ch > 0.5)), 1.0);
      }
      setOutput(result);
    }`,
  perception: `
    uniform float u_angle;
    const mat3 sobel = mat3(-1.0, 0.0, 1.0, -2.0, 0.0, 2.0, -1.0, 0.0, 1.0) / 8.0;
    void main() {
      vec2 xy = getOutputXY();
      float ch = getOutputChannel();
      float filterBand = floor(ch / u_input.depth4);
      float inputCh = mod(ch, u_input.depth4);
      if (filterBand == 0.0) {
        setOutput(u_input_read(xy, inputCh));
      } else {
        vec4 dx = vec4(0.0), dy = vec4(0.0);
        for (int y = 0; y < 3; ++y)
        for (int x = 0; x < 3; ++x) {
          vec2 p = xy + vec2(float(x - 1), float(y - 1));
          vec4 a = u_input_read(p, inputCh);
          dx += sobel[y][x] * a;
          dy += sobel[x][y] * a;
        }
        float s = sin(u_angle), c = cos(u_angle);
        setOutput(filterBand == 1.0 ? dx * c - dy * s : dx * s + dy * c);
      }
    }`,
  dense: `
    uniform sampler2D u_weightTex;
    uniform vec3 u_weightCoefs;
    const float MAX_PACKED_DEPTH = 32.0;
    vec4 readWeight(vec2 p) {
      vec4 w = texture2D(u_weightTex, p);
      return (w - u_weightCoefs.z) * u_weightCoefs.x;
    }
    vec4 readBias(vec2 p) {
      vec4 w = texture2D(u_weightTex, p);
      return (w - u_weightCoefs.z) * u_weightCoefs.y;
    }
    void main() {
      vec2 xy = getOutputXY();
      float ch = getOutputChannel();
      if (ch >= u_output.depth4) return;
      float dy = 1.0 / (u_input.depth + 1.0);
      vec2 p = vec2((ch + 0.5) / u_output.depth4, dy * 0.5);
      vec4 result = vec4(0.0);
      for (float i = 0.0; i < MAX_PACKED_DEPTH; i += 1.0) {
        vec4 inVec = u_input_read(xy, i);
        result += inVec.x * readWeight(p); p.y += dy;
        result += inVec.y * readWeight(p); p.y += dy;
        result += inVec.z * readWeight(p); p.y += dy;
        result += inVec.w * readWeight(p); p.y += dy;
        if (i + 1.5 > u_input.depth4) break;
      }
      result += readBias(p);
      setOutput(result);
    }`,
  dropout: `
    uniform float u_seed, u_udpateProbability;
    varying vec2 uv;
    float hash13(vec3 p3) {
      p3 = fract(p3 * .1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }
    void main() {
      vec2 xy = getOutputXY();
      vec4 result = u_input_readUV(uv);
      result *= float(hash13(vec3(xy, u_seed)) <= u_udpateProbability);
      setOutput(result);
    }`,
  update: `
    ${defInput('u_update')}
    varying vec2 uv;
    void main() {
      vec2 xy = getOutputXY();
      float preMaxAlpha = 0.0, postMaxAlpha = 0.0;
      for (float y = -1.0; y <= 1.0; ++y)
      for (float x = -1.0; x <= 1.0; ++x) {
        vec2 p = xy + vec2(x, y);
        float preAlpha = u_input_read(p, 0.0).a;
        float updateAlpha = u_update_read(p, 0.0).a;
        float postAlpha = preAlpha + updateAlpha;
        preMaxAlpha = max(preAlpha, preMaxAlpha);
        postMaxAlpha = max(postAlpha, postMaxAlpha);
      }
      if (min(preMaxAlpha, postMaxAlpha) < 0.1) {
        setOutput(vec4(0.0));
        return;
      }
      vec4 state = u_input_readUV(uv);
      vec4 update = u_update_readUV(uv);
      setOutput(state + update);
    }`,
  vis: `
    varying vec2 uv;
    
    vec4 sampleState(vec2 xy) {
      return u_input_read(xy, 0.0);
    }
    
    vec4 bilinearSample(vec2 xy) {
      vec2 f = fract(xy);
      vec2 i = floor(xy);
      vec4 a = sampleState(i);
      vec4 b = sampleState(i + vec2(1.0, 0.0));
      vec4 c = sampleState(i + vec2(0.0, 1.0));
      vec4 d = sampleState(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    
    void main() {
      vec2 xy = vec2(uv.x, 1.0 - uv.y) * u_input.size;
      
      vec4 rgba = bilinearSample(xy);
      vec4 color = 1.0 - rgba.a + rgba;
      
      float glowRadius = 2.0;
      vec4 glow = vec4(0.0);
      float totalWeight = 0.0;
      for (float dy = -2.0; dy <= 2.0; dy += 1.0) {
        for (float dx = -2.0; dx <= 2.0; dx += 1.0) {
          float dist = length(vec2(dx, dy));
          if (dist <= glowRadius) {
            float weight = 1.0 - dist / glowRadius;
            weight = weight * weight;
            vec4 s = bilinearSample(xy + vec2(dx, dy));
            glow += s.a * weight * vec4(s.rgb, 1.0);
            totalWeight += weight;
          }
        }
      }
      glow /= totalWeight;
      
      float alpha = rgba.a;
      vec3 glowColor = glow.rgb * 0.4;
      color.rgb = mix(color.rgb + glowColor * (1.0 - alpha), color.rgb, alpha * 0.8);
      
      color.rgb = pow(color.rgb, vec3(0.95));
      
      gl_FragColor = vec4(color.rgb, 1.0);
    }`
};

function decodeArray(s: string): Uint8Array {
  const data = atob(s);
  const buf = new Uint8Array(data.length);
  for (let i = 0; i < data.length; ++i) {
    buf[i] = data.charCodeAt(i);
  }
  return buf;
}

interface Tensor {
  _type: 'tensor';
  fbi: twgl.FramebufferInfo;
  w: number;
  h: number;
  depth: number;
  gridW: number;
  gridH: number;
  depth4: number;
  tex: WebGLTexture;
  activation?: string;
  packScaleBias: [number, number];
}

interface DenseInfo {
  tex: WebGLTexture;
  coefs: [number, number, number];
}

export function createNeuralCA(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };
  
  let gl: WebGLRenderingContext | null = null;
  let glCanvas: HTMLCanvasElement | null = null;
  let progs: Record<string, twgl.ProgramInfo> = {};
  let quad: twgl.BufferInfo | null = null;
  
  let stateBuf: Tensor | null = null;
  let newStateBuf: Tensor | null = null;
  let perceptionBuf: Tensor | null = null;
  let hiddenBuf: Tensor | null = null;
  let updateBuf: Tensor | null = null;
  let maskedUpdateBuf: Tensor | null = null;
  
  let layerTex1: DenseInfo | null = null;
  let layerTex2: DenseInfo | null = null;
  
  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function createTensor(h: number, w: number, depth: number, activation?: string): Tensor {
    if (!gl) throw new Error('GL not initialized');
    
    const depth4 = Math.ceil(depth / 4);
    const gridW = Math.ceil(Math.sqrt(depth4));
    const gridH = Math.floor((depth4 + gridW - 1) / gridW);
    const texW = w * gridW;
    const texH = h * gridH;

    const attachments = [{ minMag: gl.NEAREST }];
    const fbi = twgl.createFramebufferInfo(gl, attachments, texW, texH);
    const tex = fbi.attachments[0] as WebGLTexture;
    const C = Math.atan(MAX_ACTIVATION_VALUE);
    let packScaleBias: [number, number] = [2.0 * C, 127.0 / 255.0];
    if (activation === 'relu') {
      packScaleBias = [C, 0.0];
    }
    return {
      _type: 'tensor',
      fbi, w, h, depth, gridW, gridH, depth4, tex,
      activation, packScaleBias
    };
  }

  function setTensorUniforms(uniforms: Record<string, unknown>, name: string, tensor: Tensor): void {
    uniforms[name + '.size'] = [tensor.w, tensor.h];
    uniforms[name + '.gridSize'] = [tensor.gridW, tensor.gridH];
    uniforms[name + '.depth'] = tensor.depth;
    uniforms[name + '.depth4'] = tensor.depth4;
    uniforms[name + '.packScaleBias'] = tensor.packScaleBias;
    if (name !== 'u_output') {
      uniforms[name + '_tex'] = tensor.tex;
    }
  }

  function runLayer(programName: string, output: Tensor, inputs: Record<string, unknown>): void {
    if (!gl || !quad) return;
    
    const uniforms: Record<string, unknown> = {};
    for (const name in inputs) {
      const val = inputs[name] as Tensor | unknown;
      if (val && typeof val === 'object' && '_type' in val && val._type === 'tensor') {
        setTensorUniforms(uniforms, name, val as Tensor);
      } else {
        uniforms[name] = val;
      }
    }
    setTensorUniforms(uniforms, 'u_output', output);

    const program = progs[programName];
    twgl.bindFramebufferInfo(gl, output.fbi);
    gl.useProgram(program.program);
    twgl.setBuffersAndAttributes(gl, program, quad);
    twgl.setUniforms(program, uniforms);
    twgl.drawBufferInfo(gl, quad);
  }

  function createDenseInfo(params: typeof PRETRAINED_MODEL[0]): DenseInfo {
    if (!gl) throw new Error('GL not initialized');
    
    const src = decodeArray(params.data_b64);
    const coefs: [number, number, number] = [params.weight_scale, params.bias_scale, 0.5];
    const tex = twgl.createTexture(gl, {
      minMag: gl.NEAREST,
      width: params.out_ch / 4,
      height: params.in_ch + 1,
      src: src
    });
    return { tex, coefs };
  }

  function paint(x: number, y: number, r: number, brush: 'clear' | 'seed'): void {
    if (!stateBuf) return;
    runLayer('paint', stateBuf, {
      u_pos: [x, y],
      u_r: r,
      u_brush: brush === 'seed' ? 1.0 : 0.0,
    });
  }

  function reset(): void {
    paint(0, 0, 10000, 'clear');
    const seedRadius = Math.max(1, Math.floor(GRID_SIZE / 24));
    paint(GRID_SIZE / 2, GRID_SIZE / 2, seedRadius, 'seed');
    state.generation = 0;
  }

  function step(): void {
    if (!stateBuf || !newStateBuf || !perceptionBuf || !hiddenBuf || !updateBuf || !maskedUpdateBuf || !layerTex1 || !layerTex2) return;
    
    runLayer('perception', perceptionBuf, { u_input: stateBuf, u_angle: 0.0 });
    runLayer('dense', hiddenBuf, {
      u_input: perceptionBuf,
      u_weightTex: layerTex1.tex,
      u_weightCoefs: layerTex1.coefs
    });
    runLayer('dense', updateBuf, {
      u_input: hiddenBuf,
      u_weightTex: layerTex2.tex,
      u_weightCoefs: layerTex2.coefs
    });
    runLayer('dropout', maskedUpdateBuf, {
      u_input: updateBuf,
      u_seed: Math.random() * 1000,
      u_udpateProbability: 0.5
    });
    runLayer('update', newStateBuf, {
      u_input: stateBuf,
      u_update: maskedUpdateBuf
    });
    
    [stateBuf, newStateBuf] = [newStateBuf, stateBuf];
    state.generation++;
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      glCanvas = document.createElement('canvas');
      glCanvas.width = GRID_SIZE;
      glCanvas.height = GRID_SIZE;
      
      gl = glCanvas.getContext('webgl', { preserveDrawingBuffer: true });
      if (!gl) {
        console.error('WebGL not supported');
        return;
      }

      for (const name in PROGRAMS) {
        const fs_code = PREFIX + PROGRAMS[name];
        progs[name] = twgl.createProgramInfo(gl, [VS_CODE, fs_code]);
      }

      quad = twgl.createBufferInfoFromArrays(gl, {
        position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
      });

      stateBuf = createTensor(GRID_SIZE, GRID_SIZE, CHANNEL_N);
      newStateBuf = createTensor(GRID_SIZE, GRID_SIZE, CHANNEL_N);
      perceptionBuf = createTensor(GRID_SIZE, GRID_SIZE, CHANNEL_N * 3);
      hiddenBuf = createTensor(GRID_SIZE, GRID_SIZE, 128, 'relu');
      updateBuf = createTensor(GRID_SIZE, GRID_SIZE, CHANNEL_N);
      maskedUpdateBuf = createTensor(GRID_SIZE, GRID_SIZE, CHANNEL_N);

      layerTex1 = createDenseInfo(PRETRAINED_MODEL[0]);
      layerTex2 = createDenseInfo(PRETRAINED_MODEL[1]);

      reset();
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running || !gl) return;
      state.elapsedTime += deltaTime;
      for (let i = 0; i < STEPS_PER_FRAME; i++) {
        step();
      }
    },

    render(ctx: CanvasRenderingContext2D): void {
      if (!gl || !stateBuf || !quad || !glCanvas) return;
      
      twgl.bindFramebufferInfo(gl, null);
      gl.viewport(0, 0, GRID_SIZE, GRID_SIZE);
      
      gl.useProgram(progs.vis.program);
      twgl.setBuffersAndAttributes(gl, progs.vis, quad);
      
      const uniforms: Record<string, unknown> = {};
      setTensorUniforms(uniforms, 'u_input', stateBuf);
      twgl.setUniforms(progs.vis, uniforms);
      twgl.drawBufferInfo(gl, quad);
      
      ctx.drawImage(glCanvas, 0, 0, config.width, config.height);
    },

    start(): void {
      state.running = true;
    },

    pause(): void {
      state.running = false;
    },

    reset(): void {
      reset();
      state.elapsedTime = 0;
    },

    destroy(): void {
      if (gl) {
        if (layerTex1) gl.deleteTexture(layerTex1.tex);
        if (layerTex2) gl.deleteTexture(layerTex2.tex);
      }
      gl = null;
      glCanvas = null;
      progs = {};
      quad = null;
      stateBuf = null;
      newStateBuf = null;
      perceptionBuf = null;
      hiddenBuf = null;
      updateBuf = null;
      maskedUpdateBuf = null;
      layerTex1 = null;
      layerTex2 = null;
    },
  };
}
